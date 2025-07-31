import Anthropic from '@anthropic-ai/sdk';
import { Draft, TradingMode, ChainId, IntentParsingError, COMMON_TOKENS } from '../types';

// Initialize Anthropic client only if API key is available
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

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
 * Parse natural language trading command using regex and AI
 */
export async function parse(text: string): Promise<Draft> {
  const normalizedText = text.toLowerCase().trim();
  
  // First attempt regex-based parsing for common patterns
  const regexResult = parseWithRegex(normalizedText);
  if (regexResult) {
    return regexResult;
  }

  // Fallback to AI parsing for complex commands
  return await parseWithAI(text);
}

/**
 * Fast regex-based parsing for common patterns
 */
function parseWithRegex(text: string): Draft | null {
  try {
    // Pattern: "swap X token1 to token2 [on chain] [options]"
    const swapMatch = text.match(/swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+to\s+(\w+)(?:\s+on\s+(\w+))?/);
    if (swapMatch) {
      const [, amount, srcToken, dstToken, chain] = swapMatch;
      return {
        mode: TradingMode.SWAP,
        src: normalizeToken(srcToken),
        dst: normalizeToken(dstToken),
        amount,
        chain: chain ? normalizeChain(chain) : ChainId.ETHEREUM,
        slippage: extractSlippage(text),
      };
    }

    // Pattern: "sell X token if price >= Y"
    const stopMatch = text.match(/sell\s+(\d+(?:\.\d+)?)\s+(\w+)\s+if\s+price\s*(>=|<=|>|<)\s*(\d+(?:\.\d+)?)/);
    if (stopMatch) {
      const [, amount, token, operator, price] = stopMatch;
      return {
        mode: TradingMode.STOP,
        src: normalizeToken(token),
        dst: 'USDC', // Default to USDC for stop orders
        amount,
        chain: ChainId.ETHEREUM,
        trigger: parseFloat(price),
      };
    }

    // Pattern: "buy X token if price <= Y"
    const buyStopMatch = text.match(/buy\s+(\d+(?:\.\d+)?)\s+(\w+)\s+if\s+price\s*(<=|>=|<|>)\s*(\d+(?:\.\d+)?)/);
    if (buyStopMatch) {
      const [, amount, token, operator, price] = buyStopMatch;
      return {
        mode: TradingMode.STOP,
        src: 'USDC', // Default from USDC for buy orders
        dst: normalizeToken(token),
        amount,
        chain: ChainId.ETHEREUM,
        trigger: parseFloat(price),
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * AI-powered parsing using Claude for complex commands
 */
async function parseWithAI(text: string): Promise<Draft> {
  if (!anthropic) {
    throw new IntentParsingError('Anthropic API key not configured - cannot parse complex commands', text);
  }

  const systemPrompt = `You are an expert DeFi trading assistant. Parse natural language trading commands into structured parameters.

Available trading modes:
- swap: Immediate token exchange
- stop: Conditional order triggered by price
- limit: Limit order at specific price
- dca: Dollar cost averaging
- grid: Grid trading

Supported chains: Ethereum (1), Polygon (137), Arbitrum (42161), Optimism (10)

Common tokens: ETH, WETH, USDC, USDT, UNI, LINK, MATIC

Parse the following command and respond with ONLY a JSON object in this exact format:
{
  "mode": "swap|stop|limit|dca|grid",
  "src": "SOURCE_TOKEN_SYMBOL",
  "dst": "DESTINATION_TOKEN_SYMBOL", 
  "amount": "AMOUNT_AS_STRING",
  "chain": CHAIN_ID_NUMBER,
  "slippage": OPTIONAL_SLIPPAGE_PERCENTAGE,
  "trigger": OPTIONAL_TRIGGER_PRICE_FOR_STOPS,
  "deadline": OPTIONAL_DEADLINE_MINUTES,
  "srcChain": OPTIONAL_SOURCE_CHAIN_FOR_BRIDGE,
  "dstChain": OPTIONAL_DEST_CHAIN_FOR_BRIDGE,
  "maxLoss": OPTIONAL_MAX_LOSS_PERCENTAGE,
  "maxTime": OPTIONAL_MAX_TIME_MINUTES
}

Examples:
"swap 1 eth to usdc" → {"mode":"swap","src":"ETH","dst":"USDC","amount":"1","chain":1}
"sell 100 uni if price >= 12 usd" → {"mode":"stop","src":"UNI","dst":"USDC","amount":"100","chain":1,"trigger":12}
"bridge 5 eth from mainnet to arbitrum" → {"mode":"swap","src":"ETH","dst":"ETH","amount":"5","chain":1,"srcChain":1,"dstChain":42161}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.1,
      system: systemPrompt,
      messages: [
        { 
          role: 'user', 
          content: text 
        }
      ]
    });

    const content = message.content[0];
    if (content.type !== 'text' || !content.text) {
      throw new IntentParsingError('No response from Claude', text);
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new IntentParsingError('Invalid Claude response format', text);
    }

    const parsed = JSON.parse(jsonMatch[0]) as Draft;
    
    // Validate and normalize the parsed result
    return validateAndNormalizeDraft(parsed, text);
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
  // Validate required fields
  if (!draft.mode || !draft.src || !draft.dst || !draft.amount) {
    throw new IntentParsingError('Missing required fields in parsed command', originalText);
  }

  // Normalize tokens
  draft.src = normalizeToken(draft.src);
  draft.dst = normalizeToken(draft.dst);

  // Validate chain ID
  if (!Object.values(ChainId).includes(draft.chain)) {
    draft.chain = ChainId.ETHEREUM; // Default to Ethereum
  }

  // Validate amount
  const amountNum = parseFloat(draft.amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new IntentParsingError('Invalid amount specified', originalText);
  }

  // Set reasonable defaults
  if (!draft.slippage) {
    draft.slippage = 1.0; // 1% default slippage
  }

  if (!draft.deadline && draft.mode === TradingMode.SWAP) {
    draft.deadline = 20; // 20 minutes default deadline
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