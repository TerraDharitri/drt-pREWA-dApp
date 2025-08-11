// src/hooks/useSafeProposal.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SafeAppsSDK, { type SafeInfo } from "@safe-global/safe-apps-sdk";
import type { Address, Hex } from "viem";

type ProposeArgs = {
  to: Address;
  /** Calldata. If omitted, it will default to '0x' */
  data?: Hex | `0x${string}` | string | undefined;
  /** Wei value as string/bigint/number. If omitted, it will default to '0' */
  value?: string | bigint | number | undefined;
};

const inSafeApp = () =>
  typeof window !== "undefined" && window.parent !== window;

const to0xData = (data?: string | Hex): `0x${string}` => {
  if (!data) return "0x";
  const s = String(data);
  return (s.startsWith("0x") ? s : "0x") as `0x${string}`;
};

const toStringWei = (v?: string | bigint | number): string => {
  if (v === undefined || v === null) return "0";
  if (typeof v === "string") return v;
  if (typeof v === "number") return BigInt(v).toString();
  return v.toString();
};

/**
 * Propose a transaction from within a Safe App.
 * If not running inside a Safe, it throws an explanatory error.
 */
export function useSafeProposal() {
  const sdkRef = useRef<SafeAppsSDK | null>(null);
  const [safeInfo, setSafeInfo] = useState<SafeInfo | null>(null);
  const [isProposing, setIsProposing] = useState(false);

  // Initialize SDK & fetch safe info only when inside a Safe iframe
  useEffect(() => {
    if (!inSafeApp()) return;

    const sdk = new SafeAppsSDK();
    sdkRef.current = sdk;

    let mounted = true;
    sdk.safe
      .getInfo()
      .then((info) => {
        if (mounted) setSafeInfo(info);
      })
      .catch(() => {
        // Ignore; will just behave as not-in-safe
      });

    return () => {
      mounted = false;
    };
  }, []);

  const isSafe = useMemo(() => !!safeInfo, [safeInfo]);

  const proposeTransaction = async ({ to, data, value }: ProposeArgs) => {
    if (!inSafeApp() || !sdkRef.current) {
      throw new Error(
        "Open this page inside your Safe to propose the transaction."
      );
    }

    setIsProposing(true);
    try {
      const payload = {
        txs: [
          {
            to,
            data: to0xData(data), // <- always a string '0x...'
            value: toStringWei(value), // <- Safe expects a string
          },
        ],
      };

      // Returns { safeTxHash: string }
      const res = await sdkRef.current.txs.send(payload);
      return res;
    } finally {
      setIsProposing(false);
    }
  };

  return {
    // actions
    proposeTransaction,

    // state
    isProposing,

    // context
    isSafe,
    safe: safeInfo,
    safeAddress: safeInfo?.safeAddress,
  };
}

export default useSafeProposal;
