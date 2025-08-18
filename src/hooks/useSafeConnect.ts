// src/hooks/useSafeConnect.ts
"use client";

import { useConnect, useDisconnect, Connector } from "wagmi";

const isWcSessionError = (msg: string): boolean =>
  /(proposal expired|no matching key|session topic doesn't exist)/i.test(msg);

function clearWcKeys() {
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("wc@2")) {
        localStorage.removeItem(k);
      }
    });
  } catch (e) {
    console.error("Failed to clear WalletConnect keys from localStorage", e);
  }
}

export function useSafeConnect() {
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();

  return async (connectorId: 'injected' | 'walletConnect' | 'coinbaseWallet' | 'safe') => {
    const connector = connectors?.find?.((c) => c.id === connectorId) as Connector | undefined;
    if (!connector) {
      console.error(`Connector with id "${connectorId}" not found.`);
      return;
    }

    try {
      await connectAsync({ connector });
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (isWcSessionError(msg)) {
        console.warn("WalletConnect session error detected, clearing stale data and disconnecting.");
        try {
          // Disconnect to clean up internal wagmi state
          await disconnectAsync({ connector });
        } catch (disconnectError) {
          console.error("Failed to disconnect after session error:", disconnectError);
        }
        // Manually clear localStorage as a fallback
        clearWcKeys();
        // You can optionally show a toast message here to the user
        // toast.info("Connection expired. Please try again.");
        return;
      }
      // Re-throw other errors so they can be handled elsewhere if needed
      throw e;
    }
  };
}