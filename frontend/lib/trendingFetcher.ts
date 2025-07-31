// Stub function for trending token fetching
// This will integrate with your existing 1inch API logic

import { ChainId, TrendingToken } from './types'

/**
 * Get top trending tokens by volume
 */
export async function getTopTrending(
  chainId: ChainId = ChainId.BASE,
  limit: number = 10
): Promise<TrendingToken[]> {
  try {
    // This would integrate with 1inch API
    // For now, return mock data based on chain
    
    const mockData: Record<number, TrendingToken[]> = {
      [ChainId.BASE]: [
        {
          address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
          symbol: 'PEPE',
          name: 'Pepe',
          price: 0.000012,
          priceChange24h: 15.67,
          volume24h: 45000000,
          marketCap: 5000000000
        },
        {
          address: '0x4206931337dc273a630d328dA6441786BfaD668f',
          symbol: 'DOGE',
          name: 'Dogecoin',
          price: 0.085,
          priceChange24h: -3.21,
          volume24h: 120000000,
          marketCap: 12000000000
        },
        {
          address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
          symbol: 'UNI',
          name: 'Uniswap',
          price: 12.45,
          priceChange24h: 8.92,
          volume24h: 85000000,
          marketCap: 7500000000
        },
        {
          address: '0xA0b86a33E6441929153eE0f22dcfbddfE98B6CB4',
          symbol: 'CBETH',
          name: 'Coinbase Wrapped Staked ETH',
          price: 3241.55,
          priceChange24h: 2.14,
          volume24h: 25000000,
          marketCap: 2100000000
        },
        {
          address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          symbol: 'USDC',
          name: 'USD Coin',
          price: 1.0,
          priceChange24h: 0.01,
          volume24h: 95000000,
          marketCap: 34000000000
        }
      ],
      [ChainId.ETHEREUM]: [
        {
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          symbol: 'USDT',
          name: 'Tether USD',
          price: 1.0,
          priceChange24h: -0.02,
          volume24h: 890000000,
          marketCap: 120000000000
        },
        {
          address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
          symbol: 'UNI',
          name: 'Uniswap',
          price: 12.45,
          priceChange24h: 8.92,
          volume24h: 185000000,
          marketCap: 7500000000
        }
      ],
      [ChainId.POLYGON]: [
        {
          address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
          symbol: 'WMATIC',
          name: 'Wrapped Matic',
          price: 0.89,
          priceChange24h: 4.23,
          volume24h: 45000000,
          marketCap: 8900000000
        }
      ]
    }

    const tokens = mockData[chainId] || mockData[ChainId.BASE]
    return tokens.slice(0, limit)

  } catch (error) {
    console.error('Error fetching trending tokens:', error)
    return []
  }
}