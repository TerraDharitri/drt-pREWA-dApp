// src/hooks/useConnectIntent.ts
"use client";

import { useSafeConnect } from "@/hooks/useSafeConnect";
import { hasInjectedProvider, isMobileBrowser } from "@/lib/device";

export function useConnectIntent() {
  const safeConnect = useSafeConnect();

  return async () => {
    const preferInjected = hasInjectedProvider() && !isMobileBrowser();
    const connectorId = preferInjected ? "injected" : "walletConnect";
    await safeConnect(connectorId);
  };
}
