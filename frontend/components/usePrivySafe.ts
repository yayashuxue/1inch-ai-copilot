// Complete fallback - no Privy imports to avoid SSR issues
export function usePrivySafe() {
  return {
    ready: true,
    authenticated: false,
    user: null as any,
    login: () => alert('Connect wallet functionality coming soon!'),
    logout: () => {},
    sendTransaction: async (txData: any) => {
      alert('Transaction functionality will be enabled after deployment')
      return { transactionHash: '0x0000' }
    }
  }
}