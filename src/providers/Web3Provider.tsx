// src/providers/Web3Provider.tsx
"use client";

import { useEffect, useRef } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { reconnect } from "@wagmi/core";
import { config as wagmiConfig } from "@/config/wagmi";

const queryClient = new QueryClient();

// Patterns of WalletConnect v2 transient errors we want to swallow globally
const WC_IGNORABLE_ERRORS = /(proposal expired|no matching key|session topic doesn't exist)/i;

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const hasReconnectRun = useRef(false);

  useEffect(() => {
    if (!hasReconnectRun.current) {
      reconnect(wagmiConfig);
      hasReconnectRun.current = true;
    }
  }, []);

  // FIX: Prevent benign WC errors from triggering Next.js's error overlay
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonString = JSON.stringify(event.reason);
      if (WC_IGNORABLE_ERRORS.test(reasonString)) {
        event.preventDefault();
        console.warn("Caught and prevented benign WalletConnect error:", reasonString);
      }
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
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