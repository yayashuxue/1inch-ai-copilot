'use client'

import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { motion } from 'framer-motion'
import { 
  Zap, 
  TrendingUp, 
  Shield, 
  Brain,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import dynamic from 'next/dynamic'

const TradingInterface = dynamic(() => import('../components/TradingInterface').then(mod => ({ default: mod.TradingInterface })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  )
})
import { ConnectWallet } from '../components/ConnectWallet'
import { FeatureCard } from '../components/FeatureCard'

export default function HomePage() {
  const { ready, authenticated } = usePrivy()
  const [isTrading, setIsTrading] = useState(false)

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (authenticated && isTrading) {
    return <TradingInterface />
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 p-6 flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2"
        >
          <Zap className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Intent Copilot
          </span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <ConnectWallet />
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-xl rounded-full px-6 py-3 mb-8"
          >
            <Sparkles className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-medium">AI-Powered DeFi Trading</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent"
          >
            Trade with
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Natural Language
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Transform simple commands like <span className="text-blue-400 font-mono">"swap 1 ETH to USDC"</span> into 
            fully-formed 1inch Intents and Limit Orders. Powered by AI, secured by Base.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
          >
            {authenticated ? (
              <button
                onClick={() => setIsTrading(true)}
                className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-medium transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Start Trading</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <ConnectWallet />
            )}
            
            <button className="glass text-white px-8 py-4 rounded-xl font-medium hover:bg-white/10 transition-all">
              View Documentation
            </button>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-8"
        >
          <FeatureCard
            icon={<Brain className="h-8 w-8 text-blue-400" />}
            title="AI-Powered Parsing"
            description="Advanced natural language processing understands complex trading commands and converts them to precise blockchain transactions."
          />
          
          <FeatureCard
            icon={<TrendingUp className="h-8 w-8 text-green-400" />}
            title="1inch Integration"
            description="Direct integration with 1inch protocol for optimal swap rates, limit orders, and intent-based trading."
          />
          
          <FeatureCard
            icon={<Shield className="h-8 w-8 text-purple-400" />}
            title="Base Chain Native"
            description="Built for Base chain with multi-chain support. Fast, cheap transactions with enterprise-grade security."
          />
        </motion.div>

        {/* Example Commands */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 glass rounded-2xl p-8"
        >
          <h3 className="text-2xl font-bold text-center mb-8">Try These Commands</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <code className="text-blue-400">swap 1 ETH to USDC on base</code>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <code className="text-green-400">sell 100 UNI if price &gt;= 15 USD</code>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <code className="text-purple-400">trending tokens on base</code>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <code className="text-cyan-400">buy 0.1 ETH worth of PEPE</code>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}