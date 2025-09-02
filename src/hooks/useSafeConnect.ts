// src/hooks/useSafeConnect.ts
"use client";

import { useConnect, useDisconnect, Connector } from "wagmi";
import toast from "react-hot-toast";

const isWcSessionError = (msg: string): boolean =>
  /(proposal expired|no matching key|session topic doesn't exist)/i.test(msg);

function clearWcKeys(): void {
  try {
    Object.keys(localStorage).forEach((k: string) => {
      if (k.startsWith("wc@2")) localStorage.removeItem(k);
    });
  } catch {}
}

export function useSafeConnect() {
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();

  const connect = async (connector?: Connector) => {
    try {
      const target = connector ?? connectors.find(Boolean);
      if (!target) throw new Error("No connector available");
      return await connectAsync({ connector: target });
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (isWcSessionError(msg)) {
        try {
          await disconnectAsync();
        } catch {}
        clearWcKeys();
        toast.error("WalletConnect session expired. Please try again.");
        return;
      }
      throw e;
    }
  };

  return { connect, connectors, disconnectAsync };
}

export default useSafeConnect;
