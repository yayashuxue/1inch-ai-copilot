// Real functions for order building and validation with 1inch API
// Integrates with 1inch v6 API for quotes and swaps

import { TradingDraft, ValidationResult, OneInchQuote, ChainId } from './types'

const ONEINCH_API_BASE = 'https://api.1inch.dev'
const API_KEY = process.env.ONEINCH_API_KEY

// Token addresses for Base chain
const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  [ChainId.BASE]: {
    'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
    'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    'USDT': '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    'DAI': '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
  }
}

/**
 * Validate a trading draft before execution with real 1inch quotes
 */
export async function validateDraft(draft: TradingDraft): Promise<ValidationResult> {
  try {
    if (!draft.src || !draft.dst || !draft.amount) {
      return {
        valid: false,
        error: 'Missing required fields for swap validation'
      }
    }

    if (!API_KEY) {
      return {
        valid: false,
        error: '1inch API key not configured. Please set ONEINCH_API_KEY in your environment variables.'
      }
    }

    // Get token addresses
    const srcAddress = TOKEN_ADDRESSES[draft.chain]?.[draft.src.toUpperCase()]
    const dstAddress = TOKEN_ADDRESSES[draft.chain]?.[draft.dst.toUpperCase()]

    if (!srcAddress || !dstAddress) {
      return {
        valid: false,
        error: `Unsupported token pair: ${draft.src}/${draft.dst} on chain ${draft.chain}`
      }
    }

    // Call 1inch quote API
    const quoteUrl = new URL(`${ONEINCH_API_BASE}/swap/v6.0/${draft.chain}/quote`)
    quoteUrl.searchParams.set('src', srcAddress)
    quoteUrl.searchParams.set('dst', dstAddress)
    
    if (draft.reverse) {
      // Reverse swap: want to buy specific amount of dst token
      // Note: 1inch doesn't directly support "exact output" in quote API
      // We'll estimate by using a reasonable input amount and calculating
      const estimatedInputAmount = parseTokenAmount('0.1', 18) // Start with 0.1 ETH estimate
      quoteUrl.searchParams.set('amount', estimatedInputAmount)
    } else {
      // Normal swap: selling specific amount of src token
      quoteUrl.searchParams.set('amount', parseTokenAmount(draft.amount, 18))
    }
    
    quoteUrl.searchParams.set('includeGas', 'true')
    if (draft.slippage) {
      quoteUrl.searchParams.set('slippage', draft.slippage.toString())
    }

    const response = await fetch(quoteUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        valid: false,
        error: `1inch API error: ${response.status} ${errorText}`
      }
    }

    const quoteData = await response.json()

    let inputAmount: string
    let outputAmount: string

    if (draft.reverse) {
      // For reverse swaps, calculate required input based on desired output
      const fromTokenAmount = parseFloat(quoteData.fromTokenAmount)
      const toTokenAmount = parseFloat(quoteData.toTokenAmount)
      
      if (fromTokenAmount > 0 && toTokenAmount > 0) {
        // Calculate exchange rate (how much input we get per output token)
        const exchangeRate = fromTokenAmount / toTokenAmount
        // Calculate required input for the desired output amount
        const desiredOutputWei = parseTokenAmount(draft.amount, 18)
        const desiredOutputFloat = parseFloat(desiredOutputWei) / Math.pow(10, 18)
        const requiredInputFloat = desiredOutputFloat * exchangeRate
        inputAmount = requiredInputFloat.toFixed(6)
      } else {
        inputAmount = '0.0003' // Fallback estimate
      }
      outputAmount = draft.amount
    } else {
      // Normal swap
      inputAmount = draft.amount
      outputAmount = formatTokenAmount(quoteData.toTokenAmount, 18)
    }

    return {
      valid: true,
      estimatedGas: formatGasEstimate(quoteData.gas || quoteData.estimatedGas || '21000'),
      inputAmount,
      outputAmount,
      quote: quoteData
    }

  } catch (error) {
    return {
      valid: false,
      error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Convert human-readable amount to wei (18 decimals)
 */
function parseTokenAmount(amount: string, decimals: number = 18): string {
  const value = parseFloat(amount)
  return (value * Math.pow(10, decimals)).toString()
}

/**
 * Convert wei to human-readable amount
 */
function formatTokenAmount(amount: string, decimals: number = 18): string {
  const value = parseInt(amount) / Math.pow(10, decimals)
  return value.toFixed(6)
}

/**
 * Format gas estimate to ETH
 */
function formatGasEstimate(gasAmount: string | number): string {
  const gasPrice = 20000000000 // 20 gwei
  let gasLimit: number
  
  if (typeof gasAmount === 'string') {
    gasLimit = parseInt(gasAmount)
  } else {
    gasLimit = Math.floor(gasAmount)
  }
  
  if (isNaN(gasLimit) || gasLimit <= 0) {
    gasLimit = 21000 // Default gas limit
  }
  
  const totalGas = gasLimit * gasPrice / Math.pow(10, 18)
  return totalGas.toFixed(6)
}

/**
 * Execute a trading intent
 */
export async function executeIntent(
  draft: TradingDraft, 
  userAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  
  // This would implement the actual swap execution
  // For now, return a placeholder
  return {
    success: false,
    error: 'Swap execution not yet implemented'
  }
}