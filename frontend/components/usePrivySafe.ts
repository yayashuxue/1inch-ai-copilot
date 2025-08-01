import { usePrivy } from '@privy-io/react-auth'

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
        sendTransaction: undefined,
        connectWallet: () => {},
        wallets: []
      }
    }
    return usePrivy()
  } catch (error) {
    // Fallback when PrivyProvider is not available
    return {
      ready: true,
      authenticated: false,
      user: null,
      login: () => {},
      logout: () => {},
              sendTransaction: undefined,
        connectWallet: () => {},
        wallets: []
      }
  }
}