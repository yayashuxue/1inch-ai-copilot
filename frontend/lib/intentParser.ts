// Re-export the intent parser from the main source
// This allows the frontend to use the same AI parsing logic

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

const CHAIN_PATTERNS = {
  'base': ChainId.BASE,
  'ethereum': ChainId.ETHEREUM,
  'eth': ChainId.ETHEREUM,
  'polygon': ChainId.POLYGON,
  'matic': ChainId.POLYGON,
  'arbitrum': ChainId.ARBITRUM,
  'arb': ChainId.ARBITRUM,
}

const COMMON_TOKENS = {
  'ethereum': 'ETH',
  'bitcoin': 'BTC',
  'usdc': 'USDC',
  'usdt': 'USDT',
  'dai': 'DAI',
  'weth': 'WETH',
  'uni': 'UNI',
  'pepe': 'PEPE',
  'doge': 'DOGE',
}

/**
 * Parse natural language command into structured trading intent
 */
export async function parse(command: string): Promise<TradingDraft | null> {
  try {
    // Quick regex patterns for common commands
    const quickParse = quickParseCommand(command.toLowerCase())
    if (quickParse) {
      return quickParse
    }

    // Fallback to AI parsing for complex commands
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('No ANTHROPIC_API_KEY found, using fallback parsing')
      return fallbackParse(command)
    }

    const { object } = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
      schema: TradingDraftSchema,
      prompt: `Parse this trading command into structured data: "${command}"
      
CRITICAL: Pay attention to the direction and meaning of swap commands:

**Amount Position Logic:**
- "swap 1 ETH to USDC" = User wants to sell 1 ETH (amount=1, src=ETH, dst=USDC)
- "swap ETH to 1 USDC" = User wants to buy 1 USDC (amount=1, src=ETH, dst=USDC, reverse=true)
- "find cheapest way to swap ETH to 1 USDC" = User wants to buy 1 USDC (amount=1, src=ETH, dst=USDC, reverse=true)

**Context:**
- Default chain is Base (8453)
- Support swap, stop order, and trending commands
- Normalize token symbols (ethereum->ETH, bitcoin->BTC, etc.)
- Extract amounts, prices, and conditions accurately
- When amount follows destination token, it means "buy that amount"
- When amount follows source token, it means "sell that amount"
- If unsure about intent, set mode to 'unknown'

**Examples:**
"swap 1 eth to usdc" → {mode: "swap", src: "ETH", dst: "USDC", amount: "1", chain: 8453}
"swap eth to 1 usdc" → {mode: "swap", src: "ETH", dst: "USDC", amount: "1", chain: 8453, reverse: true}
"find cheapest way to swap eth to 5 usdc" → {mode: "swap", src: "ETH", dst: "USDC", amount: "5", chain: 8453, reverse: true}
"sell 100 uni if price >= 15" → {mode: "stop", action: "sell", token: "UNI", amount: "100", condition: ">=", price: 15, chain: 8453}
"trending tokens on polygon" → {mode: "trending", chain: 137}`,
    })

    return object
  } catch (error) {
    console.error('Parse error:', error)
    return fallbackParse(command)
  }
}

/**
 * Quick regex-based parsing for common patterns
 */
function quickParseCommand(command: string): TradingDraft | null {
  // Swap patterns: "swap X token to Y" or "X token to Y"
  const swapPattern = /(?:swap\s+)?(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for)\s+(\w+)(?:\s+on\s+(\w+))?/i
  const swapMatch = command.match(swapPattern)
  
  if (swapMatch) {
    const [, amount, srcToken, dstToken, chainName] = swapMatch
    return {
      mode: 'swap' as TradingMode,
      src: normalizeToken(srcToken),
      dst: normalizeToken(dstToken),
      amount,
      chain: chainName ? getChainId(chainName) : ChainId.BASE,
    }
  }

  // Stop order patterns: "sell X token if price >= Y"
  const stopPattern = /(buy|sell)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+if\s+price\s+(>=|<=|>|<|=)\s+(\d+(?:\.\d+)?)/i
  const stopMatch = command.match(stopPattern)
  
  if (stopMatch) {
    const [, action, amount, token, condition, price] = stopMatch
    return {
      mode: 'stop' as TradingMode,
      action: action as 'buy' | 'sell',
      token: normalizeToken(token),
      amount,
      condition: condition as '>=',
      price: parseFloat(price),
      chain: ChainId.BASE,
    }
  }

  // Trending patterns: "trending" or "trending on chain"
  const trendingPattern = /trending(?:\s+tokens?)?(?:\s+on\s+(\w+))?/i
  const trendingMatch = command.match(trendingPattern)
  
  if (trendingMatch) {
    const [, chainName] = trendingMatch
    return {
      mode: 'trending' as TradingMode,
      chain: chainName ? getChainId(chainName) : ChainId.BASE,
    }
  }

  return null
}

/**
 * Fallback parsing when AI is unavailable
 */
function fallbackParse(command: string): TradingDraft {
  const lower = command.toLowerCase()
  
  if (lower.includes('swap') || lower.includes('to')) {
    return { mode: 'swap' as TradingMode, chain: ChainId.BASE }
  }
  
  if (lower.includes('sell') || lower.includes('buy') || lower.includes('stop')) {
    return { mode: 'stop' as TradingMode, chain: ChainId.BASE }
  }
  
  if (lower.includes('trending')) {
    return { mode: 'trending' as TradingMode, chain: ChainId.BASE }
  }
  
  return { mode: 'unknown' as TradingMode, chain: ChainId.BASE }
}

/**
 * Normalize token symbols
 */
function normalizeToken(token: string): string {
  const normalized = COMMON_TOKENS[token.toLowerCase() as keyof typeof COMMON_TOKENS]
  return normalized || token.toUpperCase()
}

/**
 * Get chain ID from name
 */
function getChainId(chainName: string): number {
  return CHAIN_PATTERNS[chainName.toLowerCase() as keyof typeof CHAIN_PATTERNS] || ChainId.BASE
}