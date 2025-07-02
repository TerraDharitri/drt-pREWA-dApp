"use client";
import React, { useEffect } from 'react';
import { useAccount, useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from 'wagmi';
import { pREWAAddresses, pREWAAbis } from '@/constants';
import toast from 'react-hot-toast';
import { Address } from 'viem';

export const useAdmin = () => {
    const { chainId } = useAccount();
    const { writeContractAsync, isPending, data: hash } = useWriteContract();

    const executeAdminTask = async (contractName: keyof typeof pREWAAbis, functionName: string, args: any[]) => {
        const contractAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.[contractName] : undefined;
        if (!contractAddress) {
            toast.error(`Contract ${contractName} not found on this chain.`);
            return;
        }
        const abi = pREWAAbis[contractName];
        if (!abi) {
            toast.error(`ABI for ${contractName} not found.`);
            return;
        }

        const toastId = toast.loading(`Preparing '${functionName}' transaction...`);

        try {
            // @ts-ignore
            const { request } = await useSimulateContract({ address: contractAddress, abi, functionName, args });
            toast.loading(`Awaiting signature...`, { id: toastId });
            await writeContractAsync(request);
            toast.loading(`Executing transaction...`, { id: toastId });
        } catch (e: any) {
            console.error(e);
            toast.error(`Admin task failed: ${e.shortMessage || e.message}`, { id: toastId });
        }
    };

    const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({ hash });
    
    // CORRECTED: Use useEffect to handle side-effects
    useEffect(() => {
        if (isSuccess) {
            toast.success('Admin transaction confirmed!', { id: 'admin-tx-toast' });
        }
        if (isError) {
            toast.error('Admin transaction failed.', { id: 'admin-tx-toast' });
        }
    }, [isSuccess, isError]);

    return {
        executeAdminTask,
        isLoading: isPending || isConfirming,
    };
};