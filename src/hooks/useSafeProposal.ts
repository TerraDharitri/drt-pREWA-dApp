// src/hooks/useSafeProposal.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Address, Hex } from "viem";
import SafeAppsSDK, { type SafeInfo } from "@safe-global/safe-apps-sdk";

type ProposeArgs = {
  to: Address;
  /** Calldata for the target contract. If you don't need calldata, omit it. */
  data?: Hex;
  /** String in wei. Defaults to "0". */
  value?: string;
};

export function useSafeProposal() {
  const [sdk, setSdk] = useState<SafeAppsSDK | undefined>();
  const [safeInfo, setSafeInfo] = useState<SafeInfo | undefined>();
  const [isSafe, setIsSafe] = useState(false);
  const [isProposing, setIsProposing] = useState(false);

  // Robust Safe detection via official SDK
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const instance = new SafeAppsSDK();
        const info = await instance.safe.getInfo(); // throws if not in Safe
        if (cancelled) return;
        setSdk(instance);
        setSafeInfo(info);
        setIsSafe(true);
      } catch {
        // Not in a Safe iframe
        setSdk(undefined);
        setSafeInfo(undefined);
        setIsSafe(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const safeAddress = safeInfo?.safeAddress;

  const proposeTransaction = useMemo(
    () =>
      async ({ to, data, value }: ProposeArgs) => {
        if (!sdk || !isSafe) {
          // This message is caught by the caller and shown in the UI when needed
          throw new Error("NOT_IN_SAFE");
        }
        setIsProposing(true);
        try {
          // Safe SDK requires strings for both data and value.
          const txs = [{ to, data: (data ?? "0x") as Hex, value: value ?? "0" }];
          // returns { safeTxHash }
          return await sdk.txs.send({ txs });
        } finally {
          setIsProposing(false);
        }
      },
    [sdk, isSafe]
  );

  return { proposeTransaction, isProposing, isSafe, safeAddress };
}

export default useSafeProposal;
