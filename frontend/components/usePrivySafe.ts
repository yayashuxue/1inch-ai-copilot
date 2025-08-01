import { usePrivy } from '@privy-io/react-auth'
import { useWalletClient } from 'wagmi'

export function usePrivySafe() {
  try {
    // Only try to use Privy if we're in a browser environment
    if (typeof window === 'undefined') {
      return {
        ready: false,
        authenticated: false,
        user: null,
        login: () => {},
        logout: () => {},
        sendTransaction: undefined
      }
    }
    
    const privy = usePrivy()
    const { data: walletClient } = useWalletClient()
    
    // Create a unified sendTransaction function that works with both embedded and external wallets
    const sendTransaction = async (transaction: {
      to: string
      value: string
      data: string
    }) => {
      if (!privy.user) {
        throw new Error('User not authenticated')
      }
      
      // Check if user has an embedded wallet
      const hasEmbeddedWallet = privy.user.wallet?.walletClientType === 'privy'
      
      if (hasEmbeddedWallet) {
        // Use Privy's sendTransaction for embedded wallets
        const result = await privy.sendTransaction(transaction)
        const txHash = typeof result === 'string' ? result : result.transactionHash
        return {
          transactionHash: txHash
        }
      } else {
        // Use external wallet's sendTransaction
        if (!walletClient) {
          throw new Error('External wallet not connected')
        }
        
        const hash = await walletClient.sendTransaction({
          to: transaction.to as `0x${string}`,
          value: BigInt(transaction.value),
          data: transaction.data as `0x${string}`,
        })
        
        return {
          transactionHash: hash
        }
      }
    }
    
    return {
      ...privy,
      sendTransaction
    }
  } catch (error) {
    // Fallback when PrivyProvider is not available
    return {
      ready: true,
      authenticated: false,
      user: null,
      login: () => {
        alert('Wallet connection requires Privy configuration. Please set NEXT_PUBLIC_PRIVY_APP_ID in your .env.local file. See https://dashboard.privy.io/ to get your App ID (free for up to 1000 users).')
      },
      logout: () => {},
      sendTransaction: undefined
    }
  }
}