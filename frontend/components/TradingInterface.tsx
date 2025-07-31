'use client'

import { useState, useRef, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  ArrowLeft, 
  TrendingUp, 
  BarChart3,
  Zap,
  Bot,
  User,
  Copy,
  ExternalLink
} from 'lucide-react'
import { ConnectWallet } from './ConnectWallet'
import { TrendingTokens } from './TrendingTokens'
import toast from 'react-hot-toast'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  trade?: {
    type: 'swap' | 'stop' | 'trending'
    status: 'pending' | 'success' | 'error'
    details?: any
  }
}

export function TradingInterface() {
  const { user } = usePrivy()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello! 👋 I'm your AI trading assistant. I can help you with:

• **Swaps**: "swap 1 ETH to USDC on base"
• **Stop Orders**: "sell 100 UNI if price >= 15 USD"  
• **Trending**: "show trending tokens on base"
• **Analysis**: "analyze PEPE price action"

What would you like to trade today?`,
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'trending'>('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Call your AI parsing API
      const response = await fetch('/api/parse-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          command: input,
          userAddress: user?.wallet?.address 
        }),
      })

      const result = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: result.response || 'I understand your request. Let me process that for you.',
        timestamp: new Date(),
        trade: result.trade,
      }

      setMessages(prev => [...prev, assistantMessage])

      if (result.trade?.status === 'success') {
        toast.success('Trade executed successfully!')
      } else if (result.trade?.status === 'error') {
        toast.error('Trade failed. Please try again.')
      }

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      toast.error('Failed to process command')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="p-2 glass rounded-lg hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Intent Copilot</span>
            </div>

            {/* Tab Navigation */}
            <div className="hidden sm:flex space-x-1 glass rounded-lg p-1">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'chat' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4" />
                  <span>AI Chat</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('trending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'trending' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Trending</span>
                </div>
              </button>
            </div>
          </div>

          <ConnectWallet />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Messages */}
              <div className="glass rounded-2xl p-6 h-96 overflow-y-auto scrollbar-hide">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800/50 text-gray-100 border border-gray-700'
                      }`}>
                        <div className="flex items-start space-x-2">
                          {message.type === 'assistant' && (
                            <Bot className="h-5 w-5 mt-0.5 text-blue-400" />
                          )}
                          <div className="flex-1">
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                              {message.content}
                            </div>
                            {message.trade && (
                              <div className="mt-3 p-3 bg-gray-900/50 rounded-lg border border-gray-600">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-gray-400 uppercase">
                                    {message.trade.type} Trade
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    message.trade.status === 'success' ? 'bg-green-900 text-green-300' :
                                    message.trade.status === 'error' ? 'bg-red-900 text-red-300' :
                                    'bg-yellow-900 text-yellow-300'
                                  }`}>
                                    {message.trade.status}
                                  </span>
                                </div>
                                {message.trade.details && (
                                  <div className="text-xs text-gray-300">
                                    {JSON.stringify(message.trade.details, null, 2)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-800/50 border border-gray-700 max-w-xs px-4 py-3 rounded-2xl">
                        <div className="flex items-center space-x-2">
                          <Bot className="h-5 w-5 text-blue-400" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="glass rounded-2xl p-4">
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a trading command... (e.g., 'swap 1 ETH to USDC')"
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      disabled={isLoading}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all"
                  >
                    <Send className="h-6 w-6" />
                  </motion.button>
                </div>

                {/* Quick Commands */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    'swap 1 ETH to USDC',
                    'trending tokens',
                    'sell 100 UNI if price >= 15',
                    'buy 0.1 ETH of PEPE'
                  ].map((command) => (
                    <button
                      key={command}
                      onClick={() => setInput(command)}
                      className="text-xs bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
                    >
                      {command}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <TrendingTokens />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}