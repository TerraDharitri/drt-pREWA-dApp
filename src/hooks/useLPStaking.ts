// src/hooks/useLPStaking.ts

"use client";

import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { pREWAAddresses, pREWAAbis } from '@/constants';
import { Address, parseUnits, BaseError } from 'viem';
import toast from 'react-hot-toast';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useLPStaking = () => {
    const { address, chainId } = useAccount();
    const queryClient = useQueryClient();
    const toastIdRef = useRef<string | undefined>();
    const actionRef = useRef<string>(''); // To track the current action for toasts

    const lpStakingContractAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LPStaking : undefined;

    const { data: hash, writeContractAsync, isPending, error: writeError, reset } = useWriteContract();

    const stakeLPTokens = async (lpTokenAddress: Address, amount: string, tierId: number) => {
        if (!lpStakingContractAddress) return toast.error("LP Staking contract not found.");
        if (!amount || parseFloat(amount) <= 0) return toast.error("Amount must be greater than zero.");

        const amountInWei = parseUnits(amount, 18);
        actionRef.current = 'Stake LP Tokens';
        toastIdRef.current = toast.loading('Waiting for staking signature...');
        try {
            await writeContractAsync({
                address: lpStakingContractAddress,
                abi: pREWAAbis.LPStaking,
                functionName: 'stakeLPTokens',
                args: [lpTokenAddress, amountInWei, BigInt(tierId)],
            });
        } catch (e: any) {
            const errorMsg = e instanceof BaseError ? e.shortMessage : (e.message || "Transaction rejected.");
            toast.error(errorMsg, { id: toastIdRef.current });
            toastIdRef.current = undefined;
        }
    };

    const unstakeLPTokens = async (positionId: bigint) => {
        if (!lpStakingContractAddress) return toast.error("LP Staking contract not found.");
        
        actionRef.current = 'Unstake LP Tokens';
        toastIdRef.current = toast.loading('Waiting for unstake signature...');
        try {
            await writeContractAsync({
                address: lpStakingContractAddress,
                abi: pREWAAbis.LPStaking,
                functionName: 'unstakeLPTokens',
                args: [positionId],
            });
        } catch (e: any) {
            const errorMsg = e instanceof BaseError ? e.shortMessage : (e.message || "Transaction rejected.");
            toast.error(errorMsg, { id: toastIdRef.current });
            toastIdRef.current = undefined;
        }
    };

    const claimLPRewards = async (positionId: bigint) => {
        if (!lpStakingContractAddress) return toast.error("LP Staking contract not found.");
        
        actionRef.current = 'Claim LP Rewards';
        toastIdRef.current = toast.loading('Waiting for claim signature...');
        try {
            await writeContractAsync({
                address: lpStakingContractAddress,
                abi: pREWAAbis.LPStaking,
                functionName: 'claimLPRewards',
                args: [positionId],
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

        const actionInProgress = actionRef.current;

        if (isConfirming) {
            toast.loading(`Processing ${actionInProgress}...`, { id: toastId });
        } else if (isSuccess) {
            toast.success(`${actionInProgress} successful!`, { id: toastId });
            
            // --- MODIFIED: Broad invalidation to ensure all related queries refetch ---
            queryClient.invalidateQueries();

            reset();
            toastIdRef.current = undefined;
            actionRef.current = '';
        } else if (isError) {
            const error = receiptError || writeError;
            const errorMsg = error instanceof BaseError ? error.shortMessage : (error?.message || `${actionInProgress} failed.`);
            toast.error(errorMsg, { id: toastId });
            reset();
            toastIdRef.current = undefined;
            actionRef.current = '';
        }
    }, [isConfirming, isSuccess, isError, hash, receiptError, writeError, reset, queryClient]);

    return { stakeLPTokens, unstakeLPTokens, claimLPRewards, isLoading: isPending || isConfirming };
};