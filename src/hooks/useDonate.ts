"use client";

import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { BaseError, Address } from "viem";
import toast from "react-hot-toast";
import { useEffect, useRef } from "react";

export const useDonate = () => {
  const toastIdRef = useRef<string | undefined>();
  const {
    data: hash,
    sendTransaction,
    isPending,
    error: writeError,
    reset,
  } = useSendTransaction();

  const donate = (to: Address, amountInWei: bigint) => {
    if (!to || amountInWei <= 0n) {           // ← bigint literal
      toast.error("Please provide a valid address and amount.");
      return;
    }

    toastIdRef.current = toast.loading("Waiting for donation signature...");
    try {
      // wagmi queues the request; no need to await
      sendTransaction({ to, value: amountInWei });
    } catch (e: any) {
      const msg =
        e instanceof BaseError ? e.shortMessage : e?.message || "Transaction rejected.";
      toast.error(msg, { id: toastIdRef.current });
    }
  };

  const {
    isLoading: isConfirming,
    isSuccess,
    isError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    const id = toastIdRef.current;
    if (!hash || !id) return;

    if (isConfirming) {
      toast.loading("Processing your donation...", { id });
    } else if (isSuccess) {
      toast.success("Thank you for your donation!", { id });
      reset();
      toastIdRef.current = undefined;
    } else if (isError) {
      const err = receiptError || writeError;
      const msg =
        err instanceof BaseError ? err.shortMessage : err?.message || "Donation failed.";
      toast.error(msg, { id });
      reset();
      toastIdRef.current = undefined;
    }
  }, [hash, isConfirming, isSuccess, isError, receiptError, writeError, reset]);

  return { donate, isLoading: isPending || isConfirming };
};
