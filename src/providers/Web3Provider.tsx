// src/providers/Web3Provider.tsx
"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { config as wagmiConfig } from "@/config/wagmi";
import { useEffect, useRef } from "react";
import { reconnect } from "@wagmi/core";

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // FIX: Use a ref to ensure reconnect logic only runs once,
  // preventing the "WalletConnect Core is already initialized" warning in development.
  const hasReconnectRun = useRef(false);

  useEffect(() => {
    if (!hasReconnectRun.current) {
      reconnect(wagmiConfig);
      hasReconnectRun.current = true;
    }
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