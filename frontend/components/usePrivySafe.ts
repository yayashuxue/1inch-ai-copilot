import { usePrivy } from '@privy-io/react-auth'

export function usePrivySafe() {
  try {
    return usePrivy()
  } catch (error) {
    // Fallback when PrivyProvider is not available
    return {
      ready: true,
      authenticated: false,
      user: null,
      login: () => {},
      logout: () => {}
    }
  }
}