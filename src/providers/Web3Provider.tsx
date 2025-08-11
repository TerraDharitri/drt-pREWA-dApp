"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { config as wagmiConfig } from "@/config/wagmi";
import { useEffect } from "react";
import { reconnect } from "@wagmi/core"; // ⬅ add

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // If we’re inside Safe, the Safe connector exists and this will resolve immediately.
    reconnect(wagmiConfig).catch(() => {});
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider options={{ embedGoogleFonts: false }}>
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
