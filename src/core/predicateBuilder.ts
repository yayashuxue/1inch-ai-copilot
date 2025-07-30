import { AbiCoder, Contract, JsonRpcProvider } from 'ethers';
import { PredicateConfig, ChainId, PRICE_FEEDS, PriceFeed } from '../types';

// Chainlink AggregatorV3Interface ABI (minimal)
const CHAINLINK_ABI = [
  'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function decimals() external view returns (uint8)',
];

// Predicate function selectors for 1inch Limit Order Protocol
const PREDICATE_SELECTORS = {
  GT: '0x3b38d3c9', // gt(uint256,uint256)
  LT: '0x3cb2e5b4', // lt(uint256,uint256)
  EQ: '0x24d4ac54', // eq(uint256,uint256)
  AND: '0x4ba3c2fc', // and(bytes,bytes)
  OR: '0x4ba3c300',  // or(bytes,bytes)
  TIMESTAMP_BELOW: '0x63592c2b', // timestampBelow(uint256)
};

/**
 * Build a predicate that triggers when price >= targetPrice
 */
export function buildGtPrice(feedAddress: string, targetPrice: number): string {
  const targetPriceUint = BigInt(Math.round(targetPrice * 1e8)); // Chainlink uses 8 decimals
  
  return AbiCoder.defaultAbiCoder().encode(
    ['bytes4', 'address', 'uint256'],
    [PREDICATE_SELECTORS.GT, feedAddress, targetPriceUint]
  );
}

/**
 * Build a predicate that triggers when price <= targetPrice
 */
export function buildLtPrice(feedAddress: string, targetPrice: number): string {
  const targetPriceUint = BigInt(Math.round(targetPrice * 1e8));
  
  return AbiCoder.defaultAbiCoder().encode(
    ['bytes4', 'address', 'uint256'],
    [PREDICATE_SELECTORS.LT, feedAddress, targetPriceUint]
  );
}

/**
 * Build a predicate that triggers when price == targetPrice (within tolerance)
 */
export function buildEqPrice(feedAddress: string, targetPrice: number): string {
  const targetPriceUint = BigInt(Math.round(targetPrice * 1e8));
  
  return AbiCoder.defaultAbiCoder().encode(
    ['bytes4', 'address', 'uint256'],
    [PREDICATE_SELECTORS.EQ, feedAddress, targetPriceUint]
  );
}

/**
 * Build a predicate that triggers after a specific timestamp
 */
export function buildTimestampAfter(timestamp: number): string {
  return AbiCoder.defaultAbiCoder().encode(
    ['bytes4', 'uint256'],
    [PREDICATE_SELECTORS.TIMESTAMP_BELOW, BigInt(timestamp)]
  );
}

/**
 * Combine two predicates with AND logic
 */
export function buildAndPredicate(predicate1: string, predicate2: string): string {
  return AbiCoder.defaultAbiCoder().encode(
    ['bytes4', 'bytes', 'bytes'],
    [PREDICATE_SELECTORS.AND, predicate1, predicate2]
  );
}

/**
 * Combine two predicates with OR logic
 */
export function buildOrPredicate(predicate1: string, predicate2: string): string {
  return AbiCoder.defaultAbiCoder().encode(
    ['bytes4', 'bytes', 'bytes'],
    [PREDICATE_SELECTORS.OR, predicate1, predicate2]
  );
}

/**
 * Build predicate from configuration
 */
export function buildPredicate(config: PredicateConfig): string {
  switch (config.type) {
    case 'price_gte':
      if (!config.targetPrice) {
        throw new Error('Target price required for price_gte predicate');
      }
      return buildGtPrice(config.feedAddress, config.targetPrice);
      
    case 'price_lte':
      if (!config.targetPrice) {
        throw new Error('Target price required for price_lte predicate');
      }
      return buildLtPrice(config.feedAddress, config.targetPrice);
      
    case 'time_after':
      if (!config.timestamp) {
        throw new Error('Timestamp required for time_after predicate');
      }
      return buildTimestampAfter(config.timestamp);
      
    case 'custom':
      if (!config.customData) {
        throw new Error('Custom data required for custom predicate');
      }
      return config.customData;
      
    default:
      throw new Error(`Unsupported predicate type: ${config.type}`);
  }
}

/**
 * Get price feed address for a token symbol
 */
export function getPriceFeedAddress(tokenSymbol: string, chainId: ChainId = ChainId.ETHEREUM): string {
  const feedKey = `${tokenSymbol.toUpperCase()}/USD`;
  const feed = PRICE_FEEDS[feedKey];
  
  if (!feed || feed.chainId !== chainId) {
    throw new Error(`Price feed not found for ${tokenSymbol} on chain ${chainId}`);
  }
  
  return feed.address;
}

/**
 * Get current price from Chainlink feed
 */
export async function getCurrentPrice(
  feedAddress: string, 
  provider: JsonRpcProvider
): Promise<{ price: number; timestamp: number }> {
  const contract = new Contract(feedAddress, CHAINLINK_ABI, provider);
  
  try {
    const [roundId, answer, startedAt, updatedAt, answeredInRound] = await contract.latestRoundData();
    const decimals = await contract.decimals();
    
    const price = Number(answer) / (10 ** Number(decimals));
    const timestamp = Number(updatedAt);
    
    return { price, timestamp };
  } catch (error) {
    throw new Error(`Failed to fetch price from feed ${feedAddress}: ${error}`);
  }
}

/**
 * Validate predicate configuration
 */
export function validatePredicateConfig(config: PredicateConfig): void {
  if (!config.feedAddress || !config.feedAddress.startsWith('0x')) {
    throw new Error('Invalid feed address');
  }
  
  if (config.type === 'price_gte' || config.type === 'price_lte') {
    if (!config.targetPrice || config.targetPrice <= 0) {
      throw new Error('Invalid target price');
    }
  }
  
  if (config.type === 'time_after') {
    if (!config.timestamp || config.timestamp <= Date.now() / 1000) {
      throw new Error('Invalid timestamp - must be in the future');
    }
  }
}

/**
 * Create a stop-loss predicate (sell when price drops below target)
 */
export function createStopLossPredicate(
  tokenSymbol: string, 
  stopPrice: number, 
  chainId: ChainId = ChainId.ETHEREUM
): string {
  const feedAddress = getPriceFeedAddress(tokenSymbol, chainId);
  return buildLtPrice(feedAddress, stopPrice);
}

/**
 * Create a take-profit predicate (sell when price rises above target)
 */
export function createTakeProfitPredicate(
  tokenSymbol: string, 
  targetPrice: number, 
  chainId: ChainId = ChainId.ETHEREUM
): string {
  const feedAddress = getPriceFeedAddress(tokenSymbol, chainId);
  return buildGtPrice(feedAddress, targetPrice);
}

/**
 * Create a buy limit predicate (buy when price drops below target)
 */
export function createBuyLimitPredicate(
  tokenSymbol: string, 
  limitPrice: number, 
  chainId: ChainId = ChainId.ETHEREUM
): string {
  const feedAddress = getPriceFeedAddress(tokenSymbol, chainId);
  return buildLtPrice(feedAddress, limitPrice);
}

/**
 * Create a complex predicate with time expiration
 */
export function createTimeBoundPredicate(
  pricePredicate: string,
  expirationTimestamp: number
): string {
  const timePredicate = buildTimestampAfter(expirationTimestamp);
  return buildOrPredicate(pricePredicate, timePredicate);
}

/**
 * Decode predicate data for debugging
 */
export function decodePredicate(predicateData: string): any {
  try {
    const decoded = AbiCoder.defaultAbiCoder().decode(
      ['bytes4', 'address', 'uint256'],
      predicateData
    );
    
    return {
      selector: decoded[0],
      address: decoded[1],
      value: decoded[2].toString(),
    };
  } catch (error) {
    // Try alternative decoding formats
    try {
      const decoded = AbiCoder.defaultAbiCoder().decode(
        ['bytes4', 'uint256'],
        predicateData
      );
      
      return {
        selector: decoded[0],
        value: decoded[1].toString(),
      };
    } catch {
      return { error: 'Unable to decode predicate data' };
    }
  }
}

/**
 * Estimate gas cost for predicate execution
 */
export function estimatePredicateGas(predicateType: string): number {
  const gasEstimates: Record<string, number> = {
    'price_gte': 150000,
    'price_lte': 150000,
    'time_after': 50000,
    'and': 200000,
    'or': 200000,
    'custom': 300000,
  };
  
  return gasEstimates[predicateType] || 300000;
}

/**
 * Check if predicate is currently satisfied
 */
export async function checkPredicateCondition(
  predicateData: string,
  provider: JsonRpcProvider
): Promise<boolean> {
  try {
    const decoded = decodePredicate(predicateData);
    
    if (decoded.error) {
      throw new Error('Cannot decode predicate');
    }
    
    // For price predicates, check current price
    if (decoded.address) {
      const { price } = await getCurrentPrice(decoded.address, provider);
      const targetPrice = Number(decoded.value) / 1e8;
      
      if (decoded.selector === PREDICATE_SELECTORS.GT) {
        return price >= targetPrice;
      } else if (decoded.selector === PREDICATE_SELECTORS.LT) {
        return price <= targetPrice;
      } else if (decoded.selector === PREDICATE_SELECTORS.EQ) {
        return Math.abs(price - targetPrice) < 0.01; // Small tolerance
      }
    }
    
    // For timestamp predicates
    if (decoded.selector === PREDICATE_SELECTORS.TIMESTAMP_BELOW) {
      const targetTimestamp = Number(decoded.value);
      return Date.now() / 1000 >= targetTimestamp;
    }
    
    return false;
  } catch (error) {
    throw new Error(`Failed to check predicate condition: ${error}`);
  }
}