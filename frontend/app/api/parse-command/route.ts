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
        if (!userAddress) {
          response = `I found a swap request: **${draft.amount} ${draft.src} → ${draft.dst}** on ${getChainName(draft.chain)}.
          
To execute this trade, please connect your wallet first.

**📋 Trade Details:**
• **From:** ${draft.amount} ${draft.src}
• **To:** ${draft.dst}
• **Chain:** ${getChainName(draft.chain)}
• **Slippage:** ${draft.slippage || 1}%

Once you connect your wallet, I can validate the trade and prepare it for execution.`
        } else {
          // Validate the trade
          const validation = await validateDraft(draft)
          
          if (validation.valid) {
            response = `✅ **Trade Ready for Execution**

**📈 Swap Details:**
• **From:** ${draft.amount} ${draft.src}
• **To:** ${draft.dst}  
• **Chain:** ${getChainName(draft.chain)}
• **Estimated Gas:** ${validation.estimatedGas} ETH
• **Slippage:** ${draft.slippage || 1}%

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

**Error:** ${validation.error}

Please check your balance and try again. If you need help, you can ask me:
• "What's my balance?"
• "Show me cheaper alternatives"
• "Try a smaller amount"`

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

**🎯 Order Details:**
• **Action:** ${draft.action}
• **Amount:** ${draft.amount} ${draft.token}
• **Trigger:** Price ${draft.condition} $${draft.price}
• **Chain:** ${getChainName(draft.chain)}

${userAddress ? '✅ Stop order is ready to be placed.' : '⚠️ Connect your wallet to place this order.'}

This order will automatically execute when the trigger condition is met.`

        trade = {
          type: 'stop',
          status: userAddress ? 'pending' : 'error',
          details: draft
        }
        break

      case 'trending':
        response = `📈 **Trending Tokens Request**

Fetching the hottest tokens on **${getChainName(draft.chain)}**...

🔄 Switch to the **Trending** tab to see:
• 🚀 Top gainers by price
• 💰 Highest volume tokens  
• 📊 Market cap leaders
• ⚡ Real-time price data

The data updates automatically with the latest market information!`

        trade = {
          type: 'trending',
          status: 'success',
          details: { chain: draft.chain }
        }
        break

      default:
        const contextAwareResponse = generateContextAwareHelp(command, conversationHistory)
        response = contextAwareResponse
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