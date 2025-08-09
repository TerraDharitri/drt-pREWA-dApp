// src/hooks/useSafeProposal.ts
"use client";

import { useState } from "react";
import type { Address, Hex } from "viem";
import SafeAppsSDK from "@safe-global/safe-apps-sdk";
import toast from "react-hot-toast";

// Detect Safe iframe
const inSafeApp = () =>
  typeof window !== "undefined" && window.parent !== window;

type ProposeArgs = {
  to: Address;
  data: Hex;          // encoded calldata to your vesting contract
  value?: string;     // wei as string (default "0")
};

export function useSafeProposal() {
  const [isProposing, setIsProposing] = useState(false);

  const proposeTransaction = async ({ to, data, value = "0" }: ProposeArgs) => {
    const toastId = toast.loading("Preparing Safe transaction…");
    setIsProposing(true);

    try {
      if (!inSafeApp()) {
        toast.error(
          "Please open this app from Safe → Apps (it runs as a Safe App).",
          { id: toastId }
        );
        return;
      }

      const appsSdk = new SafeAppsSDK();

      // NB: do NOT pass `origin` here — your SDK type doesn't allow it
      const { safeTxHash } = await appsSdk.txs.send({
        txs: [
          {
            to,
            value: value.toString(),
            data,
          },
        ],
      });

      toast.success(
        "Transaction proposed in Safe. Ask other owners to approve in the Queue.",
        { id: toastId, duration: 6000 }
      );

      return { safeTxHash };
    } catch (err: any) {
      console.error(err);
      toast.error(
        `Proposal failed: ${err?.shortMessage ?? err?.message ?? "Unknown error"}`,
        { id: toastId }
      );
    } finally {
      setIsProposing(false);
    }
  };

  return { proposeTransaction, isProposing };
}
