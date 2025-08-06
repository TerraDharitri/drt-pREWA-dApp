// src/hooks/useVestingActions.ts

"use client";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Address, parseUnits, BaseError } from "viem";
import toast from "react-hot-toast";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export const useVestingActions = () => {
    const { address, chainId } = useAccount();
    const queryClient = useQueryClient();
    const toastIdRef = useRef<string | undefined>();

    const vestingFactoryAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.VestingFactory : undefined;

    const { data: hash, writeContractAsync, isPending, error: writeError, reset } = useWriteContract();

    const createVestingSchedule = async (
        beneficiary: Address,
        startTime: number, 
        cliffSeconds: number,
        durationSeconds: number,
        isRevocable: boolean,
        amount: string
    ) => {
        if (!vestingFactoryAddress) return toast.error("Vesting factory not found.");
        
        toastIdRef.current = toast.loading("Waiting for signature to create schedule...");
        
        try {
            await writeContractAsync({
                address: vestingFactoryAddress,
                abi: pREWAAbis.VestingFactory,
                functionName: 'createVesting',
                args: [
                    beneficiary,
                    BigInt(startTime),
                    BigInt(cliffSeconds),
                    BigInt(durationSeconds),
                    isRevocable,
                    parseUnits(amount, 18)
                ],
            });
        } catch (e: any) {
            const errorMsg = e instanceof BaseError ? e.shortMessage : (e.message || "Transaction rejected.");
            toast.error(errorMsg, { id: toastIdRef.current });
            toastIdRef.current = undefined;
        }
    };

    const releaseVestedTokens = async (vestingContractAddress: Address) => {
        if (!vestingContractAddress) return toast.error("Vesting contract address is missing.");

        toastIdRef.current = toast.loading("Waiting for signature to release tokens...");
        
        try {
            await writeContractAsync({
                address: vestingContractAddress,
                abi: pREWAAbis.IVesting,
                functionName: 'release',
                args: [],
            });
        } catch (e: any) {
            const errorMsg = e instanceof BaseError ? e.shortMessage : (e.message || "Transaction rejected.");
            toast.error(errorMsg, { id: toastIdRef.current });
            toastIdRef.current = undefined;
        }
    };

    const { isLoading: isConfirming, isSuccess, isError, error: receiptError } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        const toastId = toastIdRef.current;
        if (!hash || !toastId) return;

        if (isConfirming) {
            toast.loading("Processing transaction...", { id: toastId });
        } else if (isSuccess) {
            toast.success("Transaction successful!", { id: toastId });
            
            toast.loading('Refreshing on-chain data...', { id: 'refetch-toast' });
            queryClient.invalidateQueries().then(() => {
                toast.success('Data refreshed!', { id: 'refetch-toast' });
            }).catch(() => {
                toast.error('Failed to refresh data.', { id: 'refetch-toast' });
            });
            
            reset();
            toastIdRef.current = undefined;
        } else if (isError) {
            const error = receiptError || writeError;
            const errorMsg = error instanceof BaseError ? error.shortMessage : (error?.message || "Transaction failed.");
            toast.error(errorMsg, { id: toastId });
            reset();
            toastIdRef.current = undefined;
        }
    }, [isConfirming, isSuccess, isError, hash, receiptError, writeError, reset, queryClient]);

    return { 
        createVestingSchedule, 
        releaseVestedTokens,
        isLoading: isPending || isConfirming 
    };
};