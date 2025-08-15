// src/providers/Web3Provider.tsx
"use client";

import { useEffect, useRef } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { reconnect } from "@wagmi/core";
import { config as wagmiConfig } from "@/config/wagmi";

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // Ensure reconnect runs only once (avoids “WalletConnect Core is already initialized” in dev)
  const hasReconnectRun = useRef(false);

  useEffect(() => {
    if (!hasReconnectRun.current) {
      // Reconnect only authorized/previous sessions (wagmi won't propose a fresh WC session here)
      reconnect(wagmiConfig);
      hasReconnectRun.current = true;
    }
  }, []);

  // Guard: prevent WalletConnect “Proposal expired” from crashing the app after idle time
  useEffect(() => {
    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      const msg = String(e?.reason?.message ?? e?.reason ?? "");
      if (/proposal expired/i.test(msg)) {
        e.preventDefault(); // swallow just this known, harmless timeout
      }
    };
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", onUnhandledRejection);
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
