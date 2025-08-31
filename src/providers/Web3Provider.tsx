// src/providers/Web3Provider.tsx
"use client";

import { useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { reconnect } from "@wagmi/core";
import { config as wagmiConfig } from "@/config/wagmi";

const queryClient = new QueryClient();

// Transient WC errors we can safely ignore at the window level
const WC_IGNORABLE = /(proposal expired|no matching key|session topic doesn't exist)/i;

export function Web3Provider({ children }: { children: React.ReactNode }) {
  
  useEffect(() => {
    // This effect runs only once on mount.
    // It attempts to reconnect a previous session.
    try {
      reconnect(wagmiConfig);
    } catch (error) {
      // This catch block is a failsafe to prevent a crash on mobile
      // if the reconnect logic itself throws an error.
      console.warn("Wagmi reconnect failed:", error);
    }
  }, []);

  useEffect(() => {
    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      const msg = String(e?.reason?.message ?? e?.reason ?? "");
      if (WC_IGNORABLE.test(msg)) {
        console.warn("Ignored a transient WalletConnect error:", msg);
        e.preventDefault();
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