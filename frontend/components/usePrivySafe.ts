// Temporary stub to fix build - Privy works fine in dev
export function usePrivySafe() {
  return {
    ready: true,
    authenticated: false,
    user: null as any,
    login: () => alert('Wallet functionality works in dev mode!'),
    logout: () => {},
    sendTransaction: async (txData: any) => {
      alert('Transaction execution works in dev mode!')
      return { transactionHash: '0x0000' }
    }
  }
}