// src/hooks/useDonate.ts

"use client";

import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, BaseError } from 'viem';
import toast from 'react-hot-toast';
import { useEffect, useRef } from 'react';

export const useDonate = () => {
    const toastIdRef = useRef<string | undefined>();
    const { data: hash, sendTransaction, isPending, error: writeError, reset } = useSendTransaction();

    const donate = async (to: `0x${string}`, amount: string) => {
        if (!to || !amount || parseFloat(amount) <= 0) {
            toast.error("Please provide a valid address and amount.");
            return;
        }

        toastIdRef.current = toast.loading("Waiting for donation signature...");
        try {
            sendTransaction({
                to,
                value: parseEther(amount),
            });
        } catch (e: any) {
             const errorMsg = e instanceof BaseError ? e.shortMessage : (e.message || "Transaction rejected.");
            toast.error(errorMsg, { id: toastIdRef.current });
        }
    };

    const { isLoading: isConfirming, isSuccess, isError, error: receiptError } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        const toastId = toastIdRef.current;
        if (!hash || !toastId) return;

        if (isConfirming) {
            toast.loading("Processing your donation...", { id: toastId });
        } else if (isSuccess) {
            toast.success("Thank you for your donation!", { id: toastId });
            reset();
            toastIdRef.current = undefined;
        } else if (isError) {
            const error = receiptError || writeError;
            const errorMsg = error instanceof BaseError ? error.shortMessage : (error?.message || "Donation failed.");
            toast.error(errorMsg, { id: toastId });
            reset();
            toastIdRef.current = undefined;
        }
    }, [isConfirming, isSuccess, isError, hash, receiptError, writeError, reset]);

    return { donate, isLoading: isPending || isConfirming };
};