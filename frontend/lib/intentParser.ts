// Fully AI-powered intent parser - no regex patterns or hardcoded rules
import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'
import { ChainId, TradingMode } from './types'

const TradingDraftSchema = z.object({
  mode: z.enum(['swap', 'stop', 'trending', 'unknown']),
  src: z.string().optional(),
  dst: z.string().optional(),
  amount: z.string().optional(),
  reverse: z.boolean().optional(), // true when amount refers to destination token
  chain: z.number().default(ChainId.BASE),
  slippage: z.number().optional(),
  action: z.enum(['buy', 'sell']).optional(),
  token: z.string().optional(),
  condition: z.enum(['>=', '<=', '>', '<', '=']).optional(),
  price: z.number().optional(),
  limit: z.number().optional(),
})

type TradingDraft = z.infer<typeof TradingDraftSchema>

/**
 * Parse natural language command using ONLY AI - no regex patterns
 */
export async function parse(command: string): Promise<TradingDraft | null> {
  try {
    // Always use AI for parsing - no regex fallback
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is required for AI-powered intent parsing')
      return { mode: 'unknown' as TradingMode, chain: ChainId.BASE }
    }

    const { object } = await generateObject({
      model: anthropic('claude-4-sonnet'),
      schema: TradingDraftSchema,
      prompt: `You are an expert crypto trading assistant. Parse this natural language command into structured trading data: "${command}"

**CRITICAL PARSING RULES:**

1. **Direction & Amount Logic:**
   - "swap 1 ETH to USDC" = Sell 1 ETH for USDC (amount=1, src=ETH, dst=USDC, reverse=false)
   - "swap ETH to 1 USDC" = Buy 1 USDC with ETH (amount=1, src=ETH, dst=USDC, reverse=true)
   - "get 5 USDC with ETH" = Buy 5 USDC (amount=5, src=ETH, dst=USDC, reverse=true)
   - "convert 2 ETH to USDC" = Sell 2 ETH (amount=2, src=ETH, dst=USDC, reverse=false)

2. **Token Symbol Normalization:**
   - ethereum/eth → ETH
   - bitcoin/btc → BTC
   - usdc/usd-coin → USDC
   - usdt/tether → USDT
   - Always use uppercase symbols

3. **Chain Detection:**
   - Default: Base (8453)
   - Ethereum/ETH mainnet: 1
   - Polygon/Matic: 137
   - Arbitrum/Arb: 42161
   - Base: 8453

4. **Mode Classification:**
   - SWAP: Trading one token for another (swap, exchange, convert, trade, buy with, sell for)
   - STOP: Conditional orders (sell if, buy when, stop loss, take profit, if price)
   - TRENDING: Market data (trending, hot tokens, popular, what's moving)
   - UNKNOWN: Can't determine intent

5. **Stop Order Parsing:**
   - Extract action (buy/sell), token, amount, condition (>=, <=, >, <, =), and price
   - "sell 100 UNI if price >= 15" = {action: "sell", token: "UNI", amount: "100", condition: ">=", price: 15}

6. **Smart Intent Detection:**
   - Look for trading keywords in any order
   - Handle typos and variations
   - Consider context and user intent
   - Don't rely on exact phrase matching

**Examples:**
- "swap eth to 1 usdc" → {mode: "swap", src: "ETH", dst: "USDC", amount: "1", reverse: true}
- "i want to get 5 usdc using ethereum" → {mode: "swap", src: "ETH", dst: "USDC", amount: "5", reverse: true}
- "convert 0.1 eth to usdc on polygon" → {mode: "swap", src: "ETH", dst: "USDC", amount: "0.1", chain: 137}
- "sell my 50 uni tokens if price hits 20 dollars" → {mode: "stop", action: "sell", token: "UNI", amount: "50", condition: ">=", price: 20}
- "what tokens are hot right now" → {mode: "trending"}

Parse the command with intelligence and context understanding, not rigid pattern matching.`,
    })

    // Validate the parsed result
    if (object.mode === 'swap' && (!object.src || !object.dst)) {
      return { mode: 'unknown' as TradingMode, chain: ChainId.BASE }
    }

    return object
  } catch (error) {
    console.error('AI parsing error:', error)
    // Even fallback should try to be intelligent
    return intelligentFallback(command)
  }
}

/**
 * Intelligent fallback when AI fails - still no regex
 */
function intelligentFallback(command: string): TradingDraft {
  const lower = command.toLowerCase()
  
  // Use word analysis instead of regex patterns
  const hasSwapWords = ['swap', 'trade', 'exchange', 'convert', 'buy', 'sell', 'get', 'to'].some(word => lower.includes(word))
  const hasStopWords = ['if', 'when', 'stop', 'loss', 'profit', 'price', 'hits', 'reaches'].some(word => lower.includes(word))
  const hasTrendingWords = ['trending', 'hot', 'popular', 'moving', 'gainers', 'losers'].some(word => lower.includes(word))
  
  if (hasTrendingWords) {
    return { mode: 'trending' as TradingMode, chain: ChainId.BASE }
  }
  
  if (hasStopWords && hasSwapWords) {
    return { mode: 'stop' as TradingMode, chain: ChainId.BASE }
  }
  
  if (hasSwapWords) {
    return { mode: 'swap' as TradingMode, chain: ChainId.BASE }
  }
  
  return { mode: 'unknown' as TradingMode, chain: ChainId.BASE }
}