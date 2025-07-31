"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  ExternalLink,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";

interface TrendingToken {
  symbol: string;
  name: string;
  address: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap?: number;
}

export function TrendingTokens() {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState<
    "base" | "ethereum" | "polygon"
  >("base");

  const fetchTrendingTokens = async (chain: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/trending?chain=${chain}`);
      const data = await response.json();

      if (data.success) {
        setTokens(data.tokens);
      } else {
        toast.error("Failed to fetch trending tokens");
      }
    } catch (error) {
      console.error("Error fetching trending tokens:", error);
      toast.error("Failed to fetch trending tokens");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingTokens(selectedChain);
  }, [selectedChain]);

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
  };

  return (
    <motion.div
      key="trending"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4 sm:space-y-6 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
            Trending Tokens
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">
            Top performing tokens by volume and price action
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          {/* Chain Selector */}
          <div className="flex space-x-1 glass rounded-lg p-1 w-full sm:w-auto">
            {(["base", "ethereum", "polygon"] as const).map((chain) => (
              <button
                key={chain}
                onClick={() => setSelectedChain(chain)}
                className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all capitalize min-h-[36px] sm:min-h-auto ${
                  selectedChain === chain
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
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
            className="p-2 glass rounded-lg hover:bg-white/10 transition-all disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <RefreshCw
              className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
            />
          </motion.button>
        </div>
      </div>

      {/* Tokens Grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="glass rounded-xl p-4 sm:p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-700 rounded mb-3 sm:mb-4"></div>
                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-3 sm:mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-700 rounded w-16"></div>
                  <div className="h-4 bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : tokens.length > 0 ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {tokens.map((token, index) => (
              <motion.div
                key={token.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-4 sm:p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-base sm:text-lg truncate">
                      {token.symbol}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">
                      {token.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    {token.priceChange24h >= 0 ? (
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                    )}
                    <a
                      href={`https://basescan.org/token/${token.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-white/10 rounded transition-all min-h-[32px] min-w-[32px] flex items-center justify-center"
                    >
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    </a>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs sm:text-sm">
                      Price
                    </span>
                    <span className="text-white font-medium text-xs sm:text-sm">
                      {formatPrice(token.price)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs sm:text-sm">
                      24h Change
                    </span>
                    <span
                      className={`font-medium text-xs sm:text-sm ${
                        token.priceChange24h >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {token.priceChange24h >= 0 ? "+" : ""}
                      {token.priceChange24h.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs sm:text-sm">
                      Volume 24h
                    </span>
                    <span className="text-white font-medium text-xs sm:text-sm">
                      {formatVolume(token.volume24h)}
                    </span>
                  </div>

                  {token.marketCap && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs sm:text-sm">
                        Market Cap
                      </span>
                      <span className="text-white font-medium text-xs sm:text-sm">
                        {formatVolume(token.marketCap)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Trade Button */}
                <button
                  onClick={() => {
                    const command = `swap 0.1 ETH to ${token.symbol}`;
                    navigator.clipboard.writeText(command);
                    toast.success(`Copied: ${command}`);
                  }}
                  className="w-full mt-3 sm:mt-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 text-blue-300 py-2 px-4 rounded-lg text-xs sm:text-sm font-medium transition-all min-h-[40px]"
                >
                  Copy Trade Command
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-8 sm:p-12 text-center">
            <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-500 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-400 text-sm sm:text-base">
              No trending tokens found for {selectedChain}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
