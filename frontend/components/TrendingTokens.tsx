'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  ExternalLink,
  RefreshCw,
  BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'

interface TrendingToken {
  symbol: string
  name: string
  address: string
  price: number
  priceChange24h: number
  volume24h: number
  marketCap?: number
}

export function TrendingTokens() {
  const [tokens, setTokens] = useState<TrendingToken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChain, setSelectedChain] = useState<'base' | 'ethereum' | 'polygon'>('base')

  const fetchTrendingTokens = async (chain: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/trending?chain=${chain}`)
      const data = await response.json()
      
      if (data.success) {
        setTokens(data.tokens)
      } else {
        toast.error('Failed to fetch trending tokens')
      }
    } catch (error) {
      console.error('Error fetching trending tokens:', error)
      toast.error('Failed to fetch trending tokens')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTrendingTokens(selectedChain)
  }, [selectedChain])

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    return `$${price.toFixed(2)}`
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`
    return `$${volume.toFixed(2)}`
  }

  return (
    <motion.div
      key="trending"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Trending Tokens</h2>
          <p className="text-gray-400">Top performing tokens by volume and price action</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Chain Selector */}
          <div className="flex space-x-1 glass rounded-lg p-1">
            {(['base', 'ethereum', 'polygon'] as const).map((chain) => (
              <button
                key={chain}
                onClick={() => setSelectedChain(chain)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                  selectedChain === chain 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {chain}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchTrendingTokens(selectedChain)}
            disabled={isLoading}
            className="p-2 glass rounded-lg hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Tokens Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded mb-4"></div>
              <div className="h-6 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded mb-4"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-700 rounded w-16"></div>
                <div className="h-4 bg-gray-700 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : tokens.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tokens.map((token, index) => (
            <motion.div
              key={token.address}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-xl p-6 hover:bg-white/10 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{token.symbol}</h3>
                  <p className="text-gray-400 text-sm">{token.name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {token.priceChange24h >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-400" />
                  )}
                  <a
                    href={`https://basescan.org/token/${token.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-white/10 rounded transition-all"
                  >
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Price</span>
                  <span className="text-white font-medium">{formatPrice(token.price)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">24h Change</span>
                  <span className={`font-medium ${
                    token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Volume 24h</span>
                  <span className="text-white font-medium">{formatVolume(token.volume24h)}</span>
                </div>

                {token.marketCap && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Market Cap</span>
                    <span className="text-white font-medium">{formatVolume(token.marketCap)}</span>
                  </div>
                )}
              </div>

              {/* Quick Trade Button */}
              <button
                onClick={() => {
                  const command = `swap 0.1 ETH to ${token.symbol}`
                  navigator.clipboard.writeText(command)
                  toast.success(`Copied: ${command}`)
                }}
                className="w-full mt-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 text-blue-300 py-2 px-4 rounded-lg text-sm font-medium transition-all"
              >
                Copy Trade Command
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl p-12 text-center">
          <BarChart3 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No trending tokens found for {selectedChain}</p>
        </div>
      )}
    </motion.div>
  )
}