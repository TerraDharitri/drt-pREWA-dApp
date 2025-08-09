// src/providers/Web3Provider.tsx
"use client";

import React, { useMemo } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { config } from "@/config/wagmi";

const inSafeApp = () =>
  typeof window !== "undefined" && window.parent !== window;

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const safeMode = inSafeApp();

  const content = useMemo(() => {
    // Inside Safe: never render ConnectKit; no wallet prompts
    if (safeMode) return children;

    // Outside Safe: full wallet menu (injected, Coinbase, WC, Ledger)
    return <ConnectKitProvider>{children}</ConnectKitProvider>;
  }, [safeMode, children]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
    </WagmiProvider>
  );
}

export default Web3Provider;
