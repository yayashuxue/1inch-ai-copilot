import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { validateDraft } from '../../../lib/orderBuilder'
import { ChainId, TradingDraft } from '../../../lib/types'

export async function POST(request: NextRequest) {
  try {
    const { draft, userAddress, walletProvider } = await request.json()

    if (!draft || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Draft and user address are required' },
        { status: 400 }
      )
    }

    // Validate the draft first
    const validation = await validateDraft(draft)
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
        type: 'validation_error'
      })
    }

    // Execute the transaction based on draft type
    switch (draft.mode) {
      case 'swap':
        const swapResult = await executeSwap(draft, userAddress, validation)
        return NextResponse.json(swapResult)

      case 'stop':
        const stopResult = await executeStopOrder(draft, userAddress)
        return NextResponse.json(stopResult)

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported transaction type: ${draft.mode}`,
          type: 'unsupported_operation'
        })
    }

  } catch (error) {
    console.error('Transaction execution error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'execution_error'
      },
      { status: 500 }
    )
  }
}

async function executeSwap(draft: TradingDraft, userAddress: string, validation: any) {
  const ONEINCH_API_BASE = 'https://api.1inch.dev'
  const API_KEY = process.env.ONEINCH_API_KEY

  if (!API_KEY) {
    return {
      success: false,
      error: '1inch API key not configured',
      type: 'configuration_error'
    }
  }

  // Token addresses for Base chain
  const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
    [ChainId.BASE]: {
      'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      'WETH': '0x4200000000000000000000000000000000000006',
      'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      'USDT': '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      'DAI': '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      'CBETH': '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
      'COMP': '0x9e1028F5F1D5eDE59748FFceE5532509976840E0'
    }
  }

  try {
    // Validate required fields
    if (!draft.src || !draft.dst || !draft.amount) {
      return {
        success: false,
        error: 'Missing required fields: src, dst, and amount are required',
        type: 'validation_error'
      }
    }

    // Get token addresses
    const srcAddress = TOKEN_ADDRESSES[draft.chain]?.[draft.src.toUpperCase()]
    const dstAddress = TOKEN_ADDRESSES[draft.chain]?.[draft.dst.toUpperCase()]

    if (!srcAddress || !dstAddress) {
      return {
        success: false,
        error: `Unsupported token pair: ${draft.src}/${draft.dst}`,
        type: 'invalid_tokens'
      }
    }

    // Get swap transaction data from 1inch
    const swapUrl = new URL(`${ONEINCH_API_BASE}/swap/v6.0/${draft.chain}/swap`)
    swapUrl.searchParams.set('src', srcAddress)
    swapUrl.searchParams.set('dst', dstAddress)
    swapUrl.searchParams.set('amount', parseTokenAmount(draft.amount!, 18))
    swapUrl.searchParams.set('from', userAddress)
    swapUrl.searchParams.set('slippage', (draft.slippage || 1).toString())
    swapUrl.searchParams.set('disableEstimate', 'true')

    const response = await fetch(swapUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `1inch API error: ${response.status} ${errorText}`,
        type: 'api_error'
      }
    }

    const swapData = await response.json()

    // Return transaction data for frontend to execute
    return {
      success: true,
      transactionData: {
        to: swapData.tx.to,
        data: swapData.tx.data,
        value: swapData.tx.value || '0',
        gasLimit: swapData.tx.gas,
      },
      swapInfo: {
        fromToken: draft.src!,
        toToken: draft.dst!,
        fromAmount: draft.amount!,
        toAmount: formatTokenAmount(swapData.toAmount, 18),
        protocols: swapData.protocols?.[0]?.map((p: any) => p.name) || [],
      },
      validation,
      type: 'swap_ready'
    }

  } catch (error) {
    return {
      success: false,
      error: `Failed to prepare swap: ${error instanceof Error ? error.message : 'Unknown error'}`,
      type: 'preparation_error'
    }
  }
}

async function executeStopOrder(draft: TradingDraft, userAddress: string) {
  // For now, return a placeholder for stop orders
  // This would require implementing order signing and submission to 1inch orderbook
  return {
    success: false,
    error: 'Stop orders require additional implementation for order signing',
    type: 'not_implemented'
  }
}

function parseTokenAmount(amount: string, decimals: number = 18): string {
  const value = parseFloat(amount)
  return (value * Math.pow(10, decimals)).toString()
}

function formatTokenAmount(amount: string, decimals: number = 18): string {
  const value = parseInt(amount) / Math.pow(10, decimals)
  return value.toFixed(6)
}