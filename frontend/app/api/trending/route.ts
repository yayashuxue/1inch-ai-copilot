import { NextRequest, NextResponse } from 'next/server'
import { getTopTrending } from '@/lib/trendingFetcher'
import { ChainId } from '@/lib/types'

// Removed dynamic = 'force-dynamic' for static export compatibility

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chainParam = searchParams.get('chain')
    const limitParam = searchParams.get('limit')

    // Map chain names to ChainId enum
    const chainMapping: Record<string, ChainId> = {
      'ethereum': ChainId.ETHEREUM,
      'polygon': ChainId.POLYGON,
      'base': ChainId.BASE,
      'arbitrum': ChainId.ARBITRUM,
      'optimism': ChainId.OPTIMISM,
      'avalanche': ChainId.AVALANCHE,
      'fantom': ChainId.FANTOM,
      'bsc': ChainId.BSC,
      'gnosis': ChainId.GNOSIS,
      'klaytn': ChainId.KLAYTN,
      'aurora': ChainId.AURORA
    }

    const chainId = chainParam ? chainMapping[chainParam.toLowerCase()] || ChainId.BASE : ChainId.BASE
    const limit = limitParam ? parseInt(limitParam, 10) : 10

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json({ 
        success: false, 
        error: 'Limit must be between 1 and 100' 
      }, { status: 400 })
    }

    const tokens = await getTopTrending(chainId, limit)

    return NextResponse.json({
      success: true,
      tokens,
      chain: chainParam || 'base',
      limit,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Trending tokens error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch trending tokens',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}