// src/hooks/useConnectIntent.ts
"use client";

import { useSafeConnect } from "@/hooks/useSafeConnect";
import { hasInjectedProvider, isMobileBrowser } from "@/lib/device";

/**
 * A smart hook that picks the best connector for the user's environment:
 * - Desktop or dApp browser with an injected provider → "injected"
 * - Regular mobile browser (Safari/Chrome) → "walletConnect"
 */
export function useConnectIntent() {
  const safeConnect = useSafeConnect();

  return () => {
    const preferInjected = hasInjectedProvider() && !isMobileBrowser();
    const connectorId = preferInjected ? "injected" : "walletConnect";
    safeConnect(connectorId);
  };
}