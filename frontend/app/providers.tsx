"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base, mainnet, polygon, arbitrum } from "viem/chains";
import { createConfig, http } from "wagmi";
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
  chains: [base, mainnet, polygon, arbitrum],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // If no valid Privy App ID, render without authentication for now
  if (!privyAppId) {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "rgb(15 23 42)",
                color: "rgb(248 250 252)",
                border: "1px solid rgb(51 65 85)",
              },
            }}
          />
        </WagmiProvider>
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#3b82f6",
          logo: "/logo.png",
        },
        defaultChain: base,
        supportedChains: [base, mainnet, polygon, arbitrum],
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "rgb(15 23 42)",
                color: "rgb(248 250 252)",
                border: "1px solid rgb(51 65 85)",
              },
            }}
          />
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
