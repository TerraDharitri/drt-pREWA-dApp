// src/providers/Web3Provider.tsx
"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { config as wagmiConfig } from "@/config/wagmi";
import { useEffect } from "react";
import { reconnect } from "@wagmi/core"; // Import the reconnect function

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // FIX: Add this useEffect to safely reconnect on page load
  // This stabilizes the connection and prevents HMR from causing proposal errors.
  useEffect(() => {
    reconnect(wagmiConfig);
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