import axios from 'axios';
import { Wallet, JsonRpcProvider, parseEther, formatEther } from 'ethers';
import { 
  Draft, 
  TradingMode, 
  ChainId, 
  FusionSwapParams, 
  LimitOrderParams, 
  OrderStatus,
  APIError,
  OrderExecutionError 
} from '../types';
import { getTokenAddress, formatAmount } from '../ai/intentParser';
import { buildPredicate, createTakeProfitPredicate, createStopLossPredicate } from './predicateBuilder';

// 1inch API endpoints
const ONEINCH_API_BASE = 'https://api.1inch.dev';
const API_TIMEOUT = 30000;

/**
 * Build and execute a Fusion swap intent
 */
export async function buildFusionSwap(
  draft: Draft, 
  walletAddress: string
): Promise<{ txData: any; quote: any }> {
  if (draft.mode !== TradingMode.SWAP) {
    throw new Error('Invalid mode for Fusion swap');
  }

  const chainId = draft.chain || ChainId.BASE;
  
  try {
    // Get token addresses
    const srcTokenAddress = getTokenAddress(draft.src, chainId);
    const dstTokenAddress = getTokenAddress(draft.dst, chainId);
    
    // Format amount (assuming 18 decimals for now)
    const amount = formatAmount(draft.amount, 18);
    
    // Build swap parameters
    const swapParams: FusionSwapParams = {
      srcToken: srcTokenAddress,
      dstToken: dstTokenAddress,
      amount,
      from: walletAddress,
      slippage: draft.slippage || 1.0,
      deadline: draft.deadline ? Math.floor(Date.now() / 1000) + (draft.deadline * 60) : undefined,
    };

    // Get quote first
    const quote = await getQuote(swapParams, chainId);
    
    // Get swap transaction data
    const swapData = await getSwap(swapParams, chainId);
    
    return {
      txData: swapData,
      quote,
    };
  } catch (error) {
    throw new OrderExecutionError(`Failed to build Fusion swap: ${error}`);
  }
}

/**
 * Build a limit order with optional predicate
 */
export async function buildLimitOrder(
  draft: Draft,
  walletAddress: string,
  predicate?: string
): Promise<{ order: LimitOrderParams; signature?: string }> {
  const chainId = draft.chain || ChainId.BASE;
  
  try {
    // Get token addresses
    const makerAsset = getTokenAddress(draft.src, chainId);
    const takerAsset = getTokenAddress(draft.dst, chainId);
    
    // Format amounts
    const makingAmount = formatAmount(draft.amount, 18);
    
    // For limit orders, we need to calculate the taking amount based on current market rates
    // This is a simplified version - in production, you'd want more sophisticated pricing
    const quote = await getQuote({
      srcToken: makerAsset,
      dstToken: takerAsset,
      amount: makingAmount,
      from: walletAddress,
      slippage: 0, // No slippage for limit orders
    }, chainId);
    
    const takingAmount = quote.dstAmount;
    
    const order: LimitOrderParams = {
      makerAsset,
      takerAsset,
      makingAmount,
      takingAmount,
      maker: walletAddress,
      predicate,
    };

    return { order };
  } catch (error) {
    throw new OrderExecutionError(`Failed to build limit order: ${error}`);
  }
}

/**
 * Build a stop order (conditional order with price trigger)
 */
export async function buildStopOrder(
  draft: Draft,
  walletAddress: string
): Promise<{ order: LimitOrderParams; predicate: string }> {
  if (draft.mode !== TradingMode.STOP || !draft.trigger) {
    throw new Error('Invalid parameters for stop order');
  }

  const chainId = draft.chain || ChainId.BASE;
  
  // Determine if this is a stop-loss or take-profit based on the tokens
  // If we're selling the source token, it's likely a stop-loss
  // If we're buying the destination token, it's likely a take-profit
  const isStopLoss = draft.src !== 'USDC' && draft.src !== 'USDT';
  
  let predicate: string;
  if (isStopLoss) {
    // Stop-loss: sell when price drops below trigger
    predicate = createStopLossPredicate(draft.src, draft.trigger, chainId);
  } else {
    // Take-profit: buy when price drops below trigger
    predicate = createTakeProfitPredicate(draft.dst, draft.trigger, chainId);
  }

  const { order } = await buildLimitOrder(draft, walletAddress, predicate);
  
  return { order, predicate };
}

/**
 * Get quote from 1inch API
 */
async function getQuote(params: FusionSwapParams, chainId: ChainId): Promise<any> {
  const url = `${ONEINCH_API_BASE}/quote/v1.1/${chainId}/quote`;
  
  const queryParams = new URLSearchParams({
    src: params.srcToken,
    dst: params.dstToken,
    amount: params.amount,
    includeTokensInfo: 'true',
    includeProtocols: 'true',
  });

  try {
    const response = await axios.get(`${url}?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
        'Accept': 'application/json',
      },
      timeout: API_TIMEOUT,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new APIError(
        `Failed to get quote: ${error.message}`,
        error.response?.status,
        error.response?.data
      );
    }
    throw new APIError(`Unknown error getting quote: ${error}`);
  }
}

/**
 * Get swap transaction data from 1inch API
 */
async function getSwap(params: FusionSwapParams, chainId: ChainId): Promise<any> {
  const url = `${ONEINCH_API_BASE}/swap/v6.0/${chainId}/swap`;
  
  const queryParams = new URLSearchParams({
    src: params.srcToken,
    dst: params.dstToken,
    amount: params.amount,
    from: params.from,
    slippage: params.slippage.toString(),
    disableEstimate: 'true',
  });

  if (params.deadline) {
    queryParams.append('deadline', params.deadline.toString());
  }

  try {
    const response = await axios.get(`${url}?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
        'Accept': 'application/json',
      },
      timeout: API_TIMEOUT,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new APIError(
        `Failed to get swap data: ${error.message}`,
        error.response?.status,
        error.response?.data
      );
    }
    throw new APIError(`Unknown error getting swap data: ${error}`);
  }
}

/**
 * Submit limit order to 1inch orderbook
 */
export async function submitLimitOrder(
  order: LimitOrderParams,
  signature: string,
  chainId: ChainId
): Promise<string> {
  const url = `${ONEINCH_API_BASE}/orderbook/v4.0/${chainId}/order`;
  
  try {
    const response = await axios.post(url, {
      ...order,
      signature,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: API_TIMEOUT,
    });

    return response.data.orderHash || response.data.hash;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new APIError(
        `Failed to submit limit order: ${error.message}`,
        error.response?.status,
        error.response?.data
      );
    }
    throw new APIError(`Unknown error submitting limit order: ${error}`);
  }
}

/**
 * Get order status from 1inch API
 */
export async function getOrderStatus(orderHash: string, chainId: ChainId): Promise<OrderStatus> {
  const url = `${ONEINCH_API_BASE}/orderbook/v4.0/${chainId}/order/${orderHash}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
        'Accept': 'application/json',
      },
      timeout: API_TIMEOUT,
    });

    const data = response.data;
    
    return {
      hash: orderHash,
      status: mapOrderStatus(data.status),
      filledAmount: data.filledMakingAmount,
      createdAt: data.createDateTime,
      updatedAt: data.updateDateTime || data.createDateTime,
      txHash: data.txHash,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new APIError(
        `Failed to get order status: ${error.message}`,
        error.response?.status,
        error.response?.data
      );
    }
    throw new APIError(`Unknown error getting order status: ${error}`);
  }
}

/**
 * Cancel limit order
 */
export async function cancelOrder(orderHash: string, chainId: ChainId): Promise<boolean> {
  const url = `${ONEINCH_API_BASE}/orderbook/v4.0/${chainId}/order/${orderHash}`;
  
  try {
    await axios.delete(url, {
      headers: {
        'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
      },
      timeout: API_TIMEOUT,
    });

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Map 1inch order status to our status enum
 */
function mapOrderStatus(status: string): OrderStatus['status'] {
  const statusMap: Record<string, OrderStatus['status']> = {
    'pending': 'pending',
    'filled': 'filled',
    'cancelled': 'cancelled',
    'expired': 'expired',
    'failed': 'failed',
    'partially-filled': 'pending', // Still active
  };
  
  return statusMap[status] || 'pending';
}

/**
 * Execute trading intent based on draft
 */
export async function executeIntent(
  draft: Draft,
  wallet: Wallet,
  dryRun: boolean = false
): Promise<{ success: boolean; data: any; message: string }> {
  try {
    const walletAddress = await wallet.getAddress();
    
    switch (draft.mode) {
      case TradingMode.SWAP:
        const { txData, quote } = await buildFusionSwap(draft, walletAddress);
        
        if (dryRun) {
          return {
            success: true,
            data: { quote, txData },
            message: `Dry run: Would swap ${draft.amount} ${draft.src} to ${quote.dstAmount} ${draft.dst}`,
          };
        }
        
        // Execute the swap transaction
        const tx = await wallet.sendTransaction({
          to: txData.tx.to,
          data: txData.tx.data,
          value: txData.tx.value,
          gasLimit: txData.tx.gas,
        });
        
        return {
          success: true,
          data: { txHash: tx.hash, quote },
          message: `Swap executed: ${tx.hash}`,
        };
        
      case TradingMode.STOP:
        const { order, predicate } = await buildStopOrder(draft, walletAddress);
        
        if (dryRun) {
          return {
            success: true,
            data: { order, predicate },
            message: `Dry run: Would create stop order for ${draft.amount} ${draft.src} at trigger price ${draft.trigger}`,
          };
        }
        
        // TODO: Sign the order and submit to orderbook
        // This requires implementing order signing with the wallet
        return {
          success: false,
          data: null,
          message: 'Stop orders require wallet signing (not implemented in this demo)',
        };
        
      default:
        throw new Error(`Unsupported trading mode: ${draft.mode}`);
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Execution failed: ${error}`,
    };
  }
}

/**
 * Estimate gas cost for transaction
 */
export async function estimateGasCost(
  draft: Draft,
  provider: JsonRpcProvider
): Promise<{ gasLimit: string; gasPrice: string; totalCost: string }> {
  try {
    const gasPrice = await provider.getFeeData();
    
    // Rough estimates based on operation type
    const gasEstimates: Record<TradingMode, string> = {
      [TradingMode.SWAP]: '300000',
      [TradingMode.STOP]: '150000',
      [TradingMode.LIMIT]: '150000',
      [TradingMode.DCA]: '200000',
      [TradingMode.GRID]: '250000',
    };
    
    const gasLimit = gasEstimates[draft.mode] || '300000';
    const gasPriceWei = gasPrice.gasPrice || parseEther('0.00001'); // Fallback
    const totalCost = (BigInt(gasLimit) * BigInt(gasPriceWei)).toString();
    
    return {
      gasLimit,
      gasPrice: gasPriceWei.toString(),
      totalCost: formatEther(totalCost),
    };
  } catch (error) {
    // Return defaults if estimation fails
    return {
      gasLimit: '300000',
      gasPrice: parseEther('0.00001').toString(),
      totalCost: '0.003',
    };
  }
}

/**
 * Validate draft parameters before execution
 */
export function validateDraft(draft: Draft): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!draft.mode) {
    errors.push('Trading mode is required');
  }
  
  if (!draft.src || !draft.dst) {
    errors.push('Source and destination tokens are required');
  }
  
  if (!draft.amount || parseFloat(draft.amount) <= 0) {
    errors.push('Valid amount is required');
  }
  
  if (draft.mode === TradingMode.STOP && !draft.trigger) {
    errors.push('Trigger price is required for stop orders');
  }
  
  if (draft.slippage && (draft.slippage < 0 || draft.slippage > 50)) {
    errors.push('Slippage must be between 0 and 50%');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}