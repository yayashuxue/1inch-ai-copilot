import { NextRequest, NextResponse } from 'next/server'
import { getTopTrending } from '../../../lib/trendingFetcher'
import { ChainId } from '../../../lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chainParam = searchParams.get('chain') || 'base'
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'volume'

    // Map chain name to chain ID
    const chainMap: Record<string, number> = {
      'base': ChainId.BASE,
      'ethereum': ChainId.ETHEREUM,
      'polygon': ChainId.POLYGON,
      'arbitrum': ChainId.ARBITRUM
    }

    const chainId = chainMap[chainParam.toLowerCase()] || ChainId.BASE

    // Fetch trending tokens
    const trendingData = await getTopTrending(chainId, limit)

    if (!trendingData || trendingData.length === 0) {
      return NextResponse.json({
        success: true,
        tokens: [],
        message: `No trending tokens found for ${chainParam}`
      })
    }

    // Transform the data to match our frontend interface
    const tokens = trendingData.map((token: any) => ({
      symbol: token.symbol,
      name: token.name || token.symbol,
      address: token.address,
      price: parseFloat(token.price) || 0,
      priceChange24h: parseFloat(token.priceChange24h) || 0,
      volume24h: parseFloat(token.volume24h) || 0,
      marketCap: token.marketCap ? parseFloat(token.marketCap) : undefined
    }))

    // Sort by the requested criteria
    if (sortBy === 'price') {
      tokens.sort((a: any, b: any) => Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h))
    } else if (sortBy === 'volume') {
      tokens.sort((a: any, b: any) => b.volume24h - a.volume24h)
    }

    return NextResponse.json({
      success: true,
      tokens: tokens.slice(0, limit),
      chain: chainParam,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Trending tokens error:', error)
    
    // Return mock data if API fails (for demo purposes)
    const mockTokens = [
      {
        symbol: 'PEPE',
        name: 'Pepe',
        address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
        price: 0.000012,
        priceChange24h: 15.67,
        volume24h: 45000000,
        marketCap: 5000000000
      },
      {
        symbol: 'DOGE',
        name: 'Dogecoin',
        address: '0x4206931337dc273a630d328dA6441786BfaD668f',
        price: 0.085,
        priceChange24h: -3.21,
        volume24h: 120000000,
        marketCap: 12000000000
      },
      {
        symbol: 'UNI',
        name: 'Uniswap',
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        price: 12.45,
        priceChange24h: 8.92,
        volume24h: 85000000,
        marketCap: 7500000000
      }
    ]

    return NextResponse.json({
      success: true,
      tokens: mockTokens,
      chain: 'base',
      timestamp: new Date().toISOString(),
      note: 'Using mock data - API temporarily unavailable'
    })
  }
}