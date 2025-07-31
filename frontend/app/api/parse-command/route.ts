import { NextRequest, NextResponse } from 'next/server'
import { parse } from '../../../lib/intentParser'
import { executeIntent, validateDraft } from '../../../lib/orderBuilder'
import { ChainId } from '../../../lib/types'

export async function POST(request: NextRequest) {
  try {
    const { command, userAddress } = await request.json()

    if (!command) {
      return NextResponse.json(
        { success: false, error: 'Command is required' },
        { status: 400 }
      )
    }

    // Parse the natural language command
    const draft = await parse(command)
    
    if (!draft) {
      return NextResponse.json({
        success: false,
        response: "I couldn't understand that command. Please try something like 'swap 1 ETH to USDC' or 'show trending tokens'.",
      })
    }

    // Handle different command types
    let response = ''
    let trade = null

    switch (draft.mode) {
      case 'swap':
        if (!userAddress) {
          response = `I found a swap request: ${draft.amount} ${draft.src} → ${draft.dst} on ${getChainName(draft.chain)}.
          
To execute this trade, please connect your wallet first.

**Trade Details:**
• From: ${draft.amount} ${draft.src}
• To: ${draft.dst}
• Chain: ${getChainName(draft.chain)}
• Slippage: ${draft.slippage || 1}%`
        } else {
          // Validate the trade
          const validation = await validateDraft(draft)
          
          if (validation.valid) {
            response = `✅ **Trade Ready for Execution**

**Swap Details:**
• From: ${draft.amount} ${draft.src}
• To: ${draft.dst}  
• Chain: ${getChainName(draft.chain)}
• Estimated Gas: ${validation.estimatedGas} ETH
• Slippage: ${draft.slippage || 1}%

Would you like me to execute this trade?`

            trade = {
              type: 'swap',
              status: 'pending',
              details: {
                ...draft,
                validation
              }
            }
          } else {
            response = `❌ **Trade Validation Failed**

${validation.error}

Please check your balance and try again.`

            trade = {
              type: 'swap',
              status: 'error',
              details: { error: validation.error }
            }
          }
        }
        break

      case 'stop':
        response = `📊 **Stop Order Configured**

**Order Details:**
• Action: ${draft.action}
• Amount: ${draft.amount} ${draft.token}
• Trigger: Price ${draft.condition} $${draft.price}
• Chain: ${getChainName(draft.chain)}

${userAddress ? 'Stop order is ready to be placed.' : 'Connect your wallet to place this order.'}`

        trade = {
          type: 'stop',
          status: userAddress ? 'pending' : 'error',
          details: draft
        }
        break

      case 'trending':
        response = `📈 **Trending Tokens Request**

Fetching trending tokens for ${getChainName(draft.chain)}...
Switch to the Trending tab to see the latest data!`

        trade = {
          type: 'trending',
          status: 'success',
          details: { chain: draft.chain }
        }
        break

      default:
        response = `I understand you want to: "${command}"

I can help you with:
• **Swaps**: "swap 1 ETH to USDC"
• **Stop Orders**: "sell 100 UNI if price >= 15"
• **Trending**: "show trending tokens on base"

Please try one of these formats!`
    }

    return NextResponse.json({
      success: true,
      response,
      trade,
      parsed: draft
    })

  } catch (error) {
    console.error('Parse command error:', error)
    return NextResponse.json(
      { 
        success: false, 
        response: 'Sorry, I encountered an error processing your request. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getChainName(chainId: number): string {
  const chains: Record<number, string> = {
    [ChainId.BASE]: 'Base',
    [ChainId.ETHEREUM]: 'Ethereum',
    [ChainId.POLYGON]: 'Polygon',
    [ChainId.ARBITRUM]: 'Arbitrum'
  }
  return chains[chainId] || 'Unknown'
}