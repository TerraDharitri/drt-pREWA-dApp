// src/hooks/useSafeConnect.ts
"use client";

import { useConnect, useDisconnect, Connector } from "wagmi";
import toast from "react-hot-toast";

const isWcSessionError = (msg: string) =>
  /(proposal expired|no matching key|session topic doesn't exist)/i.test(msg);

function clearWcKeys() {
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("wc@2")) localStorage.removeItem(k);
    });
  } catch {}
}

export function useSafeConnect() {
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();

  return async (id: string) => {
    const connector = connectors?.find?.((c) => c.id === id) as Connector | undefined;
    if (!connector) throw new Error("Connector not found");

    try {
      await connectAsync({ connector });
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (isWcSessionError(msg)) {
        try { await disconnectAsync(); } catch {}
        clearWcKeys();
        toast.error("WalletConnect session expired. Please try again.");
        return;
      }
      throw e;
    }
  };
}