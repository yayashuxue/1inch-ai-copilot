import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
// import { openai } from '@ai-sdk/openai';
// import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { Draft, TradingMode, ChainId, IntentParsingError, COMMON_TOKENS } from '../types';

// Define the schema for parsing results
const draftSchema = z.object({
  mode: z.enum(['swap', 'stop', 'limit', 'dca', 'grid', 'trending']),
  src: z.string().optional(),
  dst: z.string().optional(),
  amount: z.string().optional(),
  chain: z.number(),
  slippage: z.number().optional(),
  trigger: z.number().optional(),
  deadline: z.number().optional(),
  srcChain: z.number().optional(),
  dstChain: z.number().optional(),
  maxLoss: z.number().optional(),
  maxTime: z.number().optional(),
});

// Lazy model initialization - evaluated when needed, not at import time
function getModel() {
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic('claude-3-5-sonnet-20241022');
  }
  // Add other providers when needed:
  // if (process.env.OPENAI_API_KEY) {
  //   return openai('gpt-4');
  // }
  // if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  //   return google('gemini-1.5-pro');
  // }
  return null;
}

// Token symbol mapping for common variants
const TOKEN_ALIASES: Record<string, string> = {
  'ethereum': 'ETH',
  'ether': 'ETH',
  'bitcoin': 'BTC',
  'usd-coin': 'USDC',
  'tether': 'USDT',
  'uniswap': 'UNI',
  'chainlink': 'LINK',
  'polygon': 'MATIC',
  'matic-network': 'MATIC',
};

// Chain name mapping
const CHAIN_ALIASES: Record<string, ChainId> = {
  'mainnet': ChainId.ETHEREUM,
  'ethereum': ChainId.ETHEREUM,
  'eth': ChainId.ETHEREUM,
  'base': ChainId.BASE,
  'polygon': ChainId.POLYGON,
  'matic': ChainId.POLYGON,
  'arbitrum': ChainId.ARBITRUM,
  'arb': ChainId.ARBITRUM,
  'optimism': ChainId.OPTIMISM,
  'op': ChainId.OPTIMISM,
  'bsc': ChainId.BSC,
  'binance': ChainId.BSC,
};

/**
 * Parse natural language trading command using AI (pure AI approach)
 */
export async function parse(text: string): Promise<Draft> {
  console.log(`🤖 AI parsing: "${text}"`);
  
  // Always use AI for parsing - no regex fallback needed
  return await parseWithAI(text);
}

/**
 * AI-powered parsing using Vercel AI SDK (model-agnostic)
 */
async function parseWithAI(text: string): Promise<Draft> {
  const model = getModel();
  if (!model) {
    throw new IntentParsingError('AI model not configured - check your API keys', text);
  }

  const systemPrompt = `You are an expert DeFi trading assistant. Parse natural language commands and detect the user's intent.

Available modes:
- swap: Token exchanges, trades, conversions, swaps
- stop: Conditional orders triggered by price (sell/buy when price hits X)
- limit: Limit orders at specific price
- dca: Dollar cost averaging
- grid: Grid trading  
- trending: Showing popular/trending tokens, market info

Supported chains: Ethereum (1), Polygon (137), Arbitrum (42161), Optimism (10), Base (8453)

INTENT DETECTION EXAMPLES:
- "1 eth to usdc" → mode: "swap"
- "trade 2 ethereum for usdc" → mode: "swap"  
- "sell 100 uni if price >= 15" → mode: "stop"
- "what's trending on base" → mode: "trending"
- "show me hot tokens" → mode: "trending"
- "popular tokens on polygon" → mode: "trending"

For swap/stop orders: src, dst, amount are required
For trending: only chain is required, src/dst/amount should be omitted

Always default to Base chain (8453) unless specified otherwise.
Be smart about detecting intent from natural language!`;

  try {
    const { object } = await generateObject({
      model,
      system: systemPrompt,
      prompt: `Parse this command and detect the intent: "${text}"`,
      schema: draftSchema,
      temperature: 0.1,
    });
    
    console.log(`✅ AI parsed: ${JSON.stringify(object, null, 2)}`);
    
    // Validate and normalize the parsed result
    return validateAndNormalizeDraft(object as Draft, text);
  } catch (error) {
    if (error instanceof IntentParsingError) {
      throw error;
    }
    throw new IntentParsingError(`Failed to parse command: ${error}`, text);
  }
}

/**
 * Validate and normalize parsed draft
 */
function validateAndNormalizeDraft(draft: Draft, originalText: string): Draft {
  // Validate required fields based on mode
  if (!draft.mode) {
    throw new IntentParsingError('Missing trading mode in parsed command', originalText);
  }
  
  // For trading operations, we need tokens and amounts
  if (draft.mode === TradingMode.SWAP || draft.mode === TradingMode.STOP || draft.mode === TradingMode.LIMIT) {
    if (!draft.src || !draft.dst || !draft.amount) {
      throw new IntentParsingError('Missing required fields (src, dst, amount) for trading operation', originalText);
    }
    
    // Normalize tokens
    draft.src = normalizeToken(draft.src);
    draft.dst = normalizeToken(draft.dst);
    
    // Validate amount
    const amountNum = parseFloat(draft.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new IntentParsingError('Invalid amount specified', originalText);
    }
  }

  // Validate chain ID
  if (!Object.values(ChainId).includes(draft.chain)) {
    draft.chain = ChainId.BASE; // Default to Base
  }

  // Set reasonable defaults for trading operations
  if (draft.mode === TradingMode.SWAP) {
    if (!draft.slippage) {
      draft.slippage = 1.0; // 1% default slippage
    }
    if (!draft.deadline) {
      draft.deadline = 20; // 20 minutes default deadline
    }
  }

  return draft;
}

/**
 * Normalize token symbol
 */
function normalizeToken(token: string): string {
  const normalized = token.toUpperCase();
  return TOKEN_ALIASES[token.toLowerCase()] || normalized;
}

/**
 * Normalize chain identifier
 */
function normalizeChain(chain: string): ChainId {
  return CHAIN_ALIASES[chain.toLowerCase()] || ChainId.ETHEREUM;
}

/**
 * Extract slippage from text
 */
function extractSlippage(text: string): number | undefined {
  const slippageMatch = text.match(/(?:slippage|slip)\s*[=:]?\s*(\d+(?:\.\d+)?)\s*%?/i);
  if (slippageMatch) {
    return parseFloat(slippageMatch[1]);
  }

  // Check for descriptive slippage terms
  if (text.includes('low slippage')) return 0.5;
  if (text.includes('high slippage')) return 3.0;
  if (text.includes('medium slippage')) return 1.5;

  return undefined;
}

/**
 * Get token address for a given chain
 */
export function getTokenAddress(symbol: string, chainId: ChainId): string {
  const chainTokens = COMMON_TOKENS[chainId];
  if (!chainTokens) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }

  const address = chainTokens[symbol.toUpperCase()];
  if (!address) {
    throw new Error(`Token ${symbol} not found on chain ${chainId}`);
  }

  return address;
}

/**
 * Format amount to wei for given token decimals
 */
export function formatAmount(amount: string, decimals: number = 18): string {
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum)) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  return (BigInt(Math.floor(amountNum * 10 ** decimals))).toString();
}

/**
 * Parse amount from wei to human readable
 */
export function parseAmount(wei: string, decimals: number = 18): string {
  const weiBig = BigInt(wei);
  const divisor = BigInt(10 ** decimals);
  const quotient = weiBig / divisor;
  const remainder = weiBig % divisor;
  
  if (remainder === 0n) {
    return quotient.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmedRemainder = remainderStr.replace(/0+$/, '');
  
  return trimmedRemainder ? `${quotient}.${trimmedRemainder}` : quotient.toString();
}