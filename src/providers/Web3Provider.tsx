// src/providers/Web3Provider.tsx
"use client";
import { useEffect, useRef } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { reconnect } from "@wagmi/core";
import { config as wagmiConfig } from "@/config/wagmi";

const queryClient = new QueryClient();
const WC_IGNORABLE = /(proposal expired|no matching key|session topic doesn't exist)/i;

function clearWcV2Keys() {
  try {
    Object.keys(localStorage).forEach((k) => k.startsWith("wc@2") && localStorage.removeItem(k));
  } catch {}
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;          // avoid double-run on HMR/StrictMode
    ran.current = true;

    // If last connector was WalletConnect, skip auto-reconnect and require a manual click.
    const last = typeof window !== "undefined"
      ? localStorage.getItem("connectkit.lastUsedConnector")
      : null;

    if (last && last.toLowerCase() === "walletconnect") {
      clearWcV2Keys();                // clear stale proposals so nothing times out later
    } else {
      reconnect(wagmiConfig).catch(() => {/* no-op */});
    }

    const onUnhandled = (evt: PromiseRejectionEvent) => {
      const msg = String(evt?.reason?.message ?? evt?.reason ?? "");
      if (WC_IGNORABLE.test(msg)) {
        evt.preventDefault();         // suppress dev overlay for benign WC expirations
      }
    };
    window.addEventListener("unhandledrejection", onUnhandled);
    return () => window.removeEventListener("unhandledrejection", onUnhandled);
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