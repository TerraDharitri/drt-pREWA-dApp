// src/hooks/useSafeConnect.ts
"use client";

import { useConnect, useDisconnect, Connector } from "wagmi";

function hasWalletConnectSession() {
  try {
    if (typeof window === "undefined") return false;
    return Object.keys(localStorage).some((k) => k.startsWith("wc@2"));
  } catch {
    return false;
  }
}

export function useSafeConnect() {
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();

  return async (id: string) => {
    const connector = connectors.find((c) => c.id === id) as Connector | undefined;
    if (!connector) throw new Error("Connector not found");

    try {
      // Optional no-op guard: prevents accidental background WC attempts elsewhere
      if (connector.id === "walletConnect" && !hasWalletConnectSession()) {
        // We still proceed because this is a user-initiated click; ConnectKit will show the modal.
        // (The guard mainly helps avoid auto-proposals in non-click code paths.)
      }

      await connectAsync({ connector });
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.toLowerCase().includes("proposal expired")) {
        // WC proposal TTL (~5m) hit; reset state so user can try again without reload
        try {
          await disconnectAsync();
        } catch {}
        try {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith("wc@2")) localStorage.removeItem(k);
          });
        } catch {}
        // Optionally show a toast here: “WalletConnect timed out. Open your wallet and try again.”
        return;
      }
      throw e;
    }
  };
}
