// Chain IDs for supported networks
export enum ChainId {
  BASE = 8453,
  ETHEREUM = 1,
  POLYGON = 137,
  ARBITRUM = 42161,
}

// Trading modes
export type TradingMode = 'swap' | 'stop' | 'trending' | 'unknown'

// Swap options for intent trading
export interface SwapOptions {
  dryRun?: boolean
  chain?: ChainId
  slippage?: number
  gasLimit?: number
  verbose?: boolean
}

// Stop order options
export interface StopOptions {
  dryRun?: boolean
  chain?: ChainId
  verbose?: boolean
}

// Trending tokens options
export interface TrendingOptions {
  chain?: ChainId
  limit?: number
  sortBy?: 'volume' | 'price' | 'marketCap'
  verbose?: boolean
}

// Trading draft structure from AI parsing
export interface TradingDraft {
  mode: TradingMode
  
  // Swap fields
  src?: string
  dst?: string
  amount?: string
  reverse?: boolean  // true when amount refers to destination token
  
  // Stop order fields
  action?: 'buy' | 'sell'
  token?: string
  condition?: '>=' | '<=' | '>' | '<' | '='
  price?: number
  
  // Common fields
  chain: ChainId
  slippage?: number
  limit?: number
}

// 1inch API response types
export interface OneInchToken {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

export interface OneInchQuote {
  fromToken: OneInchToken
  toToken: OneInchToken
  fromTokenAmount: string
  toTokenAmount: string
  estimatedGas: string
}

export interface OneInchSwap extends OneInchQuote {
  tx: {
    to: string
    data: string
    value: string
    gas: string
    gasPrice: string
  }
}

// Trading validation result
export interface ValidationResult {
  valid: boolean
  error?: string
  estimatedGas?: string
  inputAmount?: string   // Amount of input token required
  outputAmount?: string  // Amount of output token expected
  quote?: OneInchQuote
}

// Trending token data
export interface TrendingToken {
  address: string
  symbol: string
  name: string
  price: number
  priceChange24h: number
  volume24h: number
  marketCap?: number
  logoURI?: string
}

// Chainlink price feed interface
export interface PriceFeed {
  token: string
  price: number
  timestamp: number
  chain: ChainId
}

// Grid trading parameters
export interface GridParams {
  token: string
  baseAmount: string
  gridLevels: number
  priceRange: {
    min: number
    max: number
  }
  chain: ChainId
}

// TWAP parameters
export interface TWAPParams {
  token: string
  totalAmount: string
  intervalMinutes: number
  totalDuration: number
  chain: ChainId
}

// CLI command result
export interface CommandResult {
  success: boolean
  message: string
  data?: any
  txHash?: string
  error?: string
}