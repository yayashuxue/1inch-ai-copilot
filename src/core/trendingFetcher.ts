import axios, { AxiosResponse } from 'axios';
import { Token, TrendingToken, ChainId, OneInchTokensResponse, APIError } from '../types';

// 1inch API base URLs
const ONEINCH_API_BASE = 'https://api.1inch.dev';
const API_TIMEOUT = 30000;
const MAX_RETRIES = 3;

/**
 * Fetch all tokens for a given chain from 1inch API
 */
async function fetchTokensFromAPI(chainId: ChainId): Promise<Record<string, Token>> {
  const url = `${ONEINCH_API_BASE}/token/v1.2/${chainId}/tokens`;
  
  try {
    const response: AxiosResponse<OneInchTokensResponse> = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
        'Accept': 'application/json',
      },
      timeout: API_TIMEOUT,
    });

    return response.data.tokens;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new APIError(
        `Failed to fetch tokens from 1inch API: ${error.message}`,
        error.response?.status,
        error.response?.data
      );
    }
    throw new APIError(`Unknown error fetching tokens: ${error}`);
  }
}

/**
 * Get token price data from 1inch API
 */
async function fetchTokenPrice(tokenAddress: string, chainId: ChainId): Promise<{ price: number; volume24h?: number }> {
  const url = `${ONEINCH_API_BASE}/quote/v1.1/${chainId}/tokens/${tokenAddress}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${process.env.ONEINCH_API_KEY}`,
        'Accept': 'application/json',
      },
      timeout: API_TIMEOUT,
    });

    return {
      price: parseFloat(response.data.price || '0'),
      volume24h: parseFloat(response.data.volume24h || '0'),
    };
  } catch (error) {
    // Return default values if price fetch fails
    return { price: 0, volume24h: 0 };
  }
}

/**
 * Calculate trending score based on volume and price change
 */
function calculateTrendingScore(token: Token): number {
  const volumeScore = Math.log10(Math.max(token.volume24h || 1, 1)) * 10;
  const priceChangeScore = Math.abs(token.priceChange24h || 0) * 2;
  const marketCapScore = Math.log10(Math.max(token.marketCap || 1, 1)) * 5;
  
  return volumeScore + priceChangeScore + marketCapScore;
}

/**
 * Get top trending tokens by volume and price movement
 */
export async function getTopTrending(
  chainId: ChainId, 
  limit: number = 10,
  sortBy: 'volume' | 'price' | 'marketcap' | 'score' = 'volume'
): Promise<TrendingToken[]> {
  try {
    console.log(`Fetching trending tokens for chain ${chainId}...`);
    
    const tokens = await fetchTokensFromAPI(chainId);
    const tokenArray = Object.values(tokens);
    
    // Filter tokens with volume and price data
    const validTokens = tokenArray.filter(token => 
      token.volume24h && 
      token.volume24h > 0 && 
      token.symbol && 
      token.name &&
      !token.symbol.includes('_') // Filter out weird tokens
    );

    // Sort tokens based on criteria
    let sortedTokens: Token[];
    
    switch (sortBy) {
      case 'volume':
        sortedTokens = validTokens.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
        break;
      case 'price':
        sortedTokens = validTokens.sort((a, b) => Math.abs(b.priceChange24h || 0) - Math.abs(a.priceChange24h || 0));
        break;
      case 'marketcap':
        sortedTokens = validTokens.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
        break;
      case 'score':
        sortedTokens = validTokens.sort((a, b) => calculateTrendingScore(b) - calculateTrendingScore(a));
        break;
      default:
        sortedTokens = validTokens.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
    }

    // Take top tokens and create trending token objects
    const topTokens = sortedTokens.slice(0, limit);
    
    const trendingTokens: TrendingToken[] = topTokens.map((token, index) => ({
      token: {
        ...token,
        chainId,
      },
      rank: index + 1,
      volumeRank: validTokens.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0)).indexOf(token) + 1,
      priceChangeRank: validTokens.sort((a, b) => Math.abs(b.priceChange24h || 0) - Math.abs(a.priceChange24h || 0)).indexOf(token) + 1,
      score: calculateTrendingScore(token),
    }));

    return trendingTokens;
  } catch (error) {
    throw new APIError(`Failed to fetch trending tokens: ${error}`);
  }
}

/**
 * Get trending tokens with enhanced data
 */
export async function getEnhancedTrending(
  chainId: ChainId,
  limit: number = 10,
  includePrice: boolean = true
): Promise<TrendingToken[]> {
  const trendingTokens = await getTopTrending(chainId, limit);
  
  if (!includePrice) {
    return trendingTokens;
  }

  // Enhance with current price data
  const enhancedTokens = await Promise.all(
    trendingTokens.map(async (trendingToken) => {
      try {
        const priceData = await fetchTokenPrice(trendingToken.token.address, chainId);
        return {
          ...trendingToken,
          token: {
            ...trendingToken.token,
            price: priceData.price,
          },
        };
      } catch (error) {
        // Return original token if price fetch fails
        console.warn(`Failed to fetch price for ${trendingToken.token.symbol}:`, error);
        return trendingToken;
      }
    })
  );

  return enhancedTokens;
}

/**
 * Search for tokens by symbol or name
 */
export async function searchTokens(
  query: string, 
  chainId: ChainId, 
  limit: number = 5
): Promise<Token[]> {
  try {
    const tokens = await fetchTokensFromAPI(chainId);
    const tokenArray = Object.values(tokens);
    
    const normalizedQuery = query.toLowerCase();
    
    const matchingTokens = tokenArray.filter(token => 
      token.symbol.toLowerCase().includes(normalizedQuery) ||
      token.name.toLowerCase().includes(normalizedQuery)
    );

    return matchingTokens.slice(0, limit);
  } catch (error) {
    throw new APIError(`Failed to search tokens: ${error}`);
  }
}

/**
 * Get token by exact symbol
 */
export async function getTokenBySymbol(symbol: string, chainId: ChainId): Promise<Token | null> {
  try {
    const tokens = await fetchTokensFromAPI(chainId);
    const tokenArray = Object.values(tokens);
    
    const token = tokenArray.find(t => 
      t.symbol.toUpperCase() === symbol.toUpperCase()
    );

    return token || null;
  } catch (error) {
    throw new APIError(`Failed to find token ${symbol}: ${error}`);
  }
}

/**
 * Get token by address
 */
export async function getTokenByAddress(address: string, chainId: ChainId): Promise<Token | null> {
  try {
    const tokens = await fetchTokensFromAPI(chainId);
    const token = tokens[address.toLowerCase()];
    
    return token || null;
  } catch (error) {
    throw new APIError(`Failed to find token at address ${address}: ${error}`);
  }
}

/**
 * Get market summary for a chain
 */
export async function getMarketSummary(chainId: ChainId): Promise<{
  totalTokens: number;
  totalVolume24h: number;
  topGainers: Token[];
  topLosers: Token[];
}> {
  try {
    const tokens = await fetchTokensFromAPI(chainId);
    const tokenArray = Object.values(tokens);
    
    const validTokens = tokenArray.filter(token => 
      token.volume24h && token.volume24h > 0 && token.priceChange24h !== undefined
    );

    const totalVolume24h = validTokens.reduce((sum, token) => sum + (token.volume24h || 0), 0);
    
    const topGainers = validTokens
      .filter(token => (token.priceChange24h || 0) > 0)
      .sort((a, b) => (b.priceChange24h || 0) - (a.priceChange24h || 0))
      .slice(0, 5);
    
    const topLosers = validTokens
      .filter(token => (token.priceChange24h || 0) < 0)
      .sort((a, b) => (a.priceChange24h || 0) - (b.priceChange24h || 0))
      .slice(0, 5);

    return {
      totalTokens: validTokens.length,
      totalVolume24h,
      topGainers,
      topLosers,
    };
  } catch (error) {
    throw new APIError(`Failed to get market summary: ${error}`);
  }
}

/**
 * Format volume for display
 */
export function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return `$${(volume / 1e9).toFixed(2)}B`;
  } else if (volume >= 1e6) {
    return `$${(volume / 1e6).toFixed(2)}M`;
  } else if (volume >= 1e3) {
    return `$${(volume / 1e3).toFixed(2)}K`;
  } else {
    return `$${volume.toFixed(2)}`;
  }
}

/**
 * Format price change for display
 */
export function formatPriceChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Get chain name from chain ID
 */
export function getChainName(chainId: ChainId): string {
  const chainNames = {
    [ChainId.ETHEREUM]: 'Ethereum',
    [ChainId.POLYGON]: 'Polygon',
    [ChainId.ARBITRUM]: 'Arbitrum',
    [ChainId.OPTIMISM]: 'Optimism',
    [ChainId.BSC]: 'BSC',
    [ChainId.GNOSIS]: 'Gnosis',
    [ChainId.AVALANCHE]: 'Avalanche',
    [ChainId.FANTOM]: 'Fantom',
  };
  
  return chainNames[chainId] || `Chain ${chainId}`;
}

/**
 * Validate 1inch API key
 */
export async function validateAPIKey(): Promise<boolean> {
  try {
    await fetchTokensFromAPI(ChainId.ETHEREUM);
    return true;
  } catch (error) {
    return false;
  }
}