// src/hooks/useConnectIntent.ts
"use client";

import type { Connector } from "wagmi";
import { useSafeConnect } from "@/hooks/useSafeConnect";
import { hasInjectedProvider, isMobileBrowser } from "@/lib/device";

export function useConnectIntent() {
  const { connect, connectors } = useSafeConnect();

  return async () => {
    const preferInjected = hasInjectedProvider() && !isMobileBrowser();
    const connectorId = preferInjected ? "injected" : "walletConnect";

    // Explicitly type the predicate param to avoid implicit 'any'
    const target: Connector | undefined =
      connectors.find((c: Connector) => c.id === connectorId) ?? connectors[0];

    if (!target) throw new Error("No wallet connector available");
    await connect(target);
  };
}
