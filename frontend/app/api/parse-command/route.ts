import { NextRequest, NextResponse } from 'next/server'
import { parse } from '../../../lib/intentParser'
import { executeIntent, validateDraft } from '../../../lib/orderBuilder'
import { ChainId } from '../../../lib/types'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export async function POST(request: NextRequest) {
  try {
    const { command, userAddress, conversationHistory } = await request.json()

    if (!command) {
      return NextResponse.json(
        { success: false, error: 'Command is required' },
        { status: 400 }
      )
    }

    // Add conversation context to parsing
    const contextualCommand = buildContextualCommand(command, conversationHistory)
    
    // Parse the natural language command with context
    const draft = await parse(contextualCommand)
    
    if (!draft) {
      // Check if this is a follow-up question
      const contextualResponse = handleContextualResponse(command, conversationHistory)
      if (contextualResponse) {
        return NextResponse.json({
          success: true,
          response: contextualResponse,
        })
      }
      
      return NextResponse.json({
        success: false,
        response: "I couldn't understand that command. Please try something like:\n\n• **'swap 1 ETH to USDC'** - Execute a token swap\n• **'show trending tokens'** - View trending tokens\n• **'sell 100 UNI if price >= 15'** - Set up a stop order\n\nWhat would you like to trade today?",
      })
    }

    // Handle different command types
    let response = ''
    let trade = null

    switch (draft.mode) {
      case 'swap':
        // Always validate the trade with real 1inch API for quotes
        const validation = await validateDraft(draft)
        
        if (!validation.valid) {
          response = `❌ **Unable to process this swap**

${validation.error}

Please check your parameters and try again.`

          trade = {
            type: 'swap',
            status: 'error',
            details: { error: validation.error },
            highlights: {
              'Error': validation.error,
              'Suggestion': 'Check parameters or try different amounts'
            }
          }
        } else if (!userAddress) {
          response = `I can ${draft.reverse ? `help you buy ${draft.amount} ${draft.dst} using ${draft.src}` : `swap ${draft.amount} ${draft.src} to ${draft.dst}`} on ${getChainName(draft.chain)}. 
          
To execute this trade, please connect your wallet first.`

          trade = {
            type: 'swap',
            status: 'pending',
            details: {
              ...draft,
              validation
            },
            highlights: {
              'Direction': draft.reverse ? `Buy ${draft.amount} ${draft.dst}` : `Sell ${draft.amount} ${draft.src}`,
              'Chain': getChainName(draft.chain),
              'Expected Output': validation.outputAmount ? `${validation.outputAmount} ${draft.dst}` : `${draft.amount} ${draft.dst}`,
              'Required Input': validation.inputAmount ? `${validation.inputAmount} ${draft.src}` : `${draft.amount} ${draft.src}`,
              'Gas Cost': validation.estimatedGas ? `${validation.estimatedGas} ETH` : 'TBD',
              'Slippage': draft.slippage ? `${draft.slippage}%` : '1%',
              'Note': 'Connect wallet to execute'
            }
          }
        } else {
          response = `✅ **Trade Ready for Execution**

I can ${draft.reverse ? `help you buy ${draft.amount} ${draft.dst} using ${draft.src}` : `swap ${draft.amount} ${draft.src} to ${draft.dst}`} on ${getChainName(draft.chain)}.

Would you like me to execute this trade?`

          trade = {
            type: 'swap',
            status: 'pending',
            details: {
              ...draft,
              validation
            },
            highlights: {
              'Trade': draft.reverse ? `${draft.src} → ${draft.amount} ${draft.dst}` : `${draft.amount} ${draft.src} → ${draft.dst}`,
              'Expected Output': validation.outputAmount ? `${validation.outputAmount} ${draft.dst}` : `${draft.amount} ${draft.dst}`,
              'Required Input': validation.inputAmount ? `${validation.inputAmount} ${draft.src}` : `${draft.amount} ${draft.src}`,
              'Gas Cost': validation.estimatedGas ? `${validation.estimatedGas} ETH` : 'TBD',
              'Slippage': draft.slippage ? `${draft.slippage}%` : '1%'
            },
            canExecute: true
          }
        }
        break

      case 'stop':
        response = `I'll set up a stop order to ${draft.action} ${draft.amount} ${draft.token} when price ${draft.condition} $${draft.price} on ${getChainName(draft.chain)}.

${userAddress ? 'Stop order is ready to be placed.' : 'Connect your wallet to place this order.'}`

        trade = {
          type: 'stop',
          status: userAddress ? 'pending' : 'error',
          details: draft,
          highlights: {
            'Order Type': `${draft.action?.toUpperCase()} order`,
            'Amount': `${draft.amount} ${draft.token}`,
            'Trigger': `Price ${draft.condition} $${draft.price}`,
            'Chain': getChainName(draft.chain)
          }
        }
        break

      case 'trending':
        response = `I'll show you the trending tokens on ${getChainName(draft.chain)}. 

Switch to the Trending tab to see the latest data!`

        trade = {
          type: 'trending',
          status: 'success',
          details: { chain: draft.chain },
          highlights: {
            'Action': 'Fetch trending tokens',
            'Chain': getChainName(draft.chain),
            'Data': 'Price, volume, market cap'
          }
        }
        break

      default:
        response = `I understand you want to: "${command}"

I can help you with:
• Token swaps: "swap 1 ETH to USDC"
• Stop orders: "sell 100 UNI if price >= 15"  
• Market data: "show trending tokens"

What would you like to try?`
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
        response: '😓 Sorry, I encountered an error processing your request.\n\nPlease try again, or ask me something like:\n• "swap 1 ETH to USDC"\n• "show trending tokens"\n• "help with trading"',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function buildContextualCommand(command: string, history: Message[] = []): string {
  if (!history || history.length === 0) return command
  
  // Add context from recent conversation
  const recentMessages = history.slice(-3) // Last 3 messages
  const context = recentMessages
    .filter(msg => msg.type === 'user')
    .map(msg => msg.content)
    .join(' ')
  
  // If the command seems like a continuation, add context
  const continuationWords = ['yes', 'no', 'ok', 'sure', 'that', 'it', 'this', 'execute', 'confirm', 'cancel']
  if (continuationWords.some(word => command.toLowerCase().includes(word))) {
    return `${context} ${command}`
  }
  
  return command
}

function handleContextualResponse(command: string, history: Message[] = []): string | null {
  const lowerCommand = command.toLowerCase()
  
  // Handle simple confirmations
  if (['yes', 'ok', 'sure', 'execute', 'confirm', 'do it'].includes(lowerCommand)) {
    // Check if there's a recent pending trade in the conversation
    const recentMessages = history.slice(-5)
    const hasPendingTrade = recentMessages.some(msg => 
      msg.type === 'assistant' && 
      msg.content.includes('execute this trade') || 
      msg.content.includes('Trade Ready for Execution')
    )
    
    if (hasPendingTrade) {
      return `Perfect! I can see you want to execute the trade we just prepared. 

**To execute the transaction:**
1. 🔘 Click the green **"Execute Transaction"** button in the trade details above
2. 📝 Review the transaction details in your wallet
3. ✅ Confirm the transaction

The transaction will be submitted to the blockchain and you'll see real-time status updates here.

*Note: Make sure you have enough ETH for gas fees on the Base network.*`
    }
    
    return `I understand you want to proceed, but I need a bit more context. Could you please specify what action you'd like me to take?

For example:
• **"execute the swap"** - to proceed with a trade
• **"place the order"** - to submit a stop order
• **"show me more"** - to get additional information`
  }
  
  // Handle negations
  if (['no', 'cancel', 'stop', 'nevermind'].includes(lowerCommand)) {
    return `No problem! The action has been cancelled. 

What else can I help you with?
• 💱 Execute token swaps
• 📊 Set up stop orders  
• 📈 View trending tokens
• 🔍 Analyze market data`
  }
  
  // Handle greetings
  if (['hi', 'hello', 'hey', 'howdy'].includes(lowerCommand)) {
    return `Hello! 👋 I'm your AI trading assistant.

I can help you with:
• **Token Swaps:** "swap 1 ETH to USDC"
• **Stop Orders:** "sell 100 UNI if price >= 15"  
• **Market Data:** "show trending tokens"
• **Analysis:** "analyze PEPE price"

What would you like to trade today?`
  }
  
  return null
}

function generateContextAwareHelp(command: string, history: Message[] = []): string {
  return `I understand you want to: **"${command}"**

I can help you with:

🔄 **Swaps:**
• "swap 1 ETH to USDC"
• "exchange 0.5 WETH for DAI"
• "convert 100 USDC to ETH"

📊 **Stop Orders:**
• "sell 100 UNI if price >= 15"
• "buy 50 LINK when price drops to 10"

📈 **Market Data:**
• "show trending tokens on base"
• "what's hot on ethereum"

💡 **Tips:**
• Be specific with amounts and tokens
• Mention the blockchain if needed
• Ask follow-up questions anytime!

What would you like to try?`
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