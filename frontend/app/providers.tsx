"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}
