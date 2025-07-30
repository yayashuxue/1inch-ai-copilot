// Chain IDs for supported networks
export enum ChainId {
  ETHEREUM = 1,
  BASE = 8453,
  POLYGON = 137,
  ARBITRUM = 42161,
  OPTIMISM = 10,
  BSC = 56,
  GNOSIS = 100,
  AVALANCHE = 43114,
  FANTOM = 250,
}

// Supported trading modes
export enum TradingMode {
  SWAP = 'swap',
  STOP = 'stop',
  LIMIT = 'limit',
  DCA = 'dca',
  GRID = 'grid',
}

// Token information
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: ChainId;
  price?: number;
  volume24h?: number;
  priceChange24h?: number;
  marketCap?: number;
}

// Parsed intent from natural language
export interface ParsedIntent {
  mode: TradingMode;
  srcToken: string;
  dstToken: string;
  amount: string;
  chain: ChainId;
  slippage?: number;
  deadline?: number;
  trigger?: {
    type: 'gte' | 'lte' | 'eq';
    price: number;
    token: string;
  };
  crossChain?: {
    srcChain: ChainId;
    dstChain: ChainId;
    maxLoss: number;
    maxTime: number;
  };
}

// Draft parameters extracted from AI parsing
export interface Draft {
  mode: TradingMode;
  src: string;
  dst: string;
  amount: string;
  chain: ChainId;
  trigger?: number;
  slippage?: number;
  deadline?: number;
  srcChain?: ChainId;
  dstChain?: ChainId;
  maxLoss?: number;
  maxTime?: number;
}

// 1inch Fusion swap parameters
export interface FusionSwapParams {
  srcToken: string;
  dstToken: string;
  amount: string;
  from: string;
  slippage: number;
  deadline?: number;
  permit?: string;
}

// 1inch Limit Order parameters
export interface LimitOrderParams {
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  maker: string;
  predicate?: string;
  permit?: string;
  interaction?: string;
}

// Chainlink price feed configuration
export interface PriceFeed {
  address: string;
  description: string;
  decimals: number;
  heartbeat: number;
  chainId: ChainId;
}

// Predicate configuration for conditional orders
export interface PredicateConfig {
  type: 'price_gte' | 'price_lte' | 'time_after' | 'custom';
  feedAddress: string;
  targetPrice?: number;
  timestamp?: number;
  customData?: string;
}

// Order status tracking
export interface OrderStatus {
  hash: string;
  status: 'pending' | 'filled' | 'cancelled' | 'expired' | 'failed';
  filledAmount?: string;
  createdAt: number;
  updatedAt: number;
  txHash?: string;
  error?: string;
}

// Trending token data
export interface TrendingToken {
  token: Token;
  rank: number;
  volumeRank: number;
  priceChangeRank: number;
  score: number;
}

// API response interfaces
export interface OneInchTokensResponse {
  tokens: Record<string, Token>;
}

export interface OneInchQuoteResponse {
  dstAmount: string;
  srcToken: Token;
  dstToken: Token;
  protocols: any[];
  gas: number;
}

export interface OneInchSwapResponse extends OneInchQuoteResponse {
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gas: number;
    gasPrice: string;
  };
}

// Configuration interfaces
export interface Config {
  apiKey: string;
  openaiKey: string;
  rpcs: Record<ChainId, string>;
  defaultChain: ChainId;
  defaultSlippage: number;
  defaultGasLimit: number;
  apiTimeout: number;
  maxRetries: number;
}

// CLI command options
export interface SwapOptions {
  chain?: string;
  slippage?: number;
  deadline?: number;
  amount?: string;
  from?: string;
  to?: string;
  dryRun?: boolean;
}

export interface StopOptions {
  chain?: string;
  slippage?: number;
  dryRun?: boolean;
}

export interface TrendingOptions {
  chain?: string;
  limit?: number;
  sortBy?: 'volume' | 'price' | 'marketcap';
  timeframe?: '1h' | '24h' | '7d';
}

// Error types
export class IntentParsingError extends Error {
  constructor(message: string, public originalText: string) {
    super(message);
    this.name = 'IntentParsingError';
  }
}

export class OrderExecutionError extends Error {
  constructor(message: string, public orderHash?: string) {
    super(message);
    this.name = 'OrderExecutionError';
  }
}

export class APIError extends Error {
  constructor(message: string, public statusCode?: number, public response?: any) {
    super(message);
    this.name = 'APIError';
  }
}

// Utility types
export type Address = string;
export type BigNumberish = string | number | bigint;
export type Hex = string;

// Price feed addresses for major tokens (Ethereum mainnet)
export const PRICE_FEEDS: Record<string, PriceFeed> = {
  'ETH/USD': {
    address: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    description: 'ETH / USD',
    decimals: 8,
    heartbeat: 3600,
    chainId: ChainId.ETHEREUM,
  },
  'BTC/USD': {
    address: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
    description: 'BTC / USD',
    decimals: 8,
    heartbeat: 3600,
    chainId: ChainId.ETHEREUM,
  },
  'UNI/USD': {
    address: '0x553303d460EE0afB37EdFf9bE42922D8FF63220e',
    description: 'UNI / USD',
    decimals: 8,
    heartbeat: 3600,
    chainId: ChainId.ETHEREUM,
  },
  'LINK/USD': {
    address: '0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c',
    description: 'LINK / USD',
    decimals: 8,
    heartbeat: 3600,
    chainId: ChainId.ETHEREUM,
  },
};

// Common token addresses
export const COMMON_TOKENS: Record<ChainId, Record<string, string>> = {
  [ChainId.ETHEREUM]: {
    'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    'USDC': '0xA0b86a33E6441E2BBb0b9ceAe5b1E8FbF4b6B5b8',
    'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  },
  [ChainId.BASE]: {
    'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'WETH': '0x4200000000000000000000000000000000000006',
    'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    'USDT': '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    'DEGEN': '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
    'BRETT': '0x532f27101965dd16442E59d40670FaF5eBB142E4',
  },
  [ChainId.POLYGON]: {
    'MATIC': '0x0000000000000000000000000000000000001010',
    'WMATIC': '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    'USDC': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  },
  [ChainId.ARBITRUM]: {
    'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'WETH': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    'USDC': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  },
  [ChainId.OPTIMISM]: {
    'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'WETH': '0x4200000000000000000000000000000000000006',
    'USDC': '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    'USDT': '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
  },
  [ChainId.BSC]: {
    'BNB': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'WBNB': '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    'USDT': '0x55d398326f99059fF775485246999027B3197955',
  },
  [ChainId.GNOSIS]: {
    'xDAI': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'WXDAI': '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
    'USDC': '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83',
  },
  [ChainId.AVALANCHE]: {
    'AVAX': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'WAVAX': '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    'USDC': '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664',
    'USDT': '0xc7198437980c041c805A1EDcbA50c1Ce5db95118',
  },
  [ChainId.FANTOM]: {
    'FTM': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'WFTM': '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
    'USDC': '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
    'USDT': '0x049d68029688eAbF473097a2fC38ef61633A3C7A',
  },
};