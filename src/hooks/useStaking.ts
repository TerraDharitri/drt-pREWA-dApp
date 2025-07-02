"use client";
import React, { useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from 'wagmi';
import { pREWAAbis, pREWAAddresses } from '@/constants';
import { parseUnits } from 'viem';
import toast from 'react-hot-toast';

export const useStaking = () => {
    const { address, chainId } = useAccount();
    const contractAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.TokenStaking : undefined;
    
    const { data: userPositionsCount, refetch: refetchPositionsCount } = useReadContract({
        address: contractAddress,
        abi: pREWAAbis.TokenStaking,
        functionName: 'getPositionCount',
        args: [address!],
        query: { enabled: !!address }
    });

    const { writeContractAsync, isPending, data: hash } = useWriteContract();

    const executeStakingTask = async (functionName: 'stake' | 'unstake' | 'claimRewards', args: any[], toastId: string) => {
        try {
            // @ts-ignore
            const { request } = await useSimulateContract({ address: contractAddress, abi: pREWAAbis.TokenStaking, functionName, args });
            toast.loading('Awaiting signature...', { id: toastId });
            await writeContractAsync(request);
            toast.loading('Processing transaction...', { id: toastId });
        } catch (e: any) {
            toast.error(`Task failed: ${e.shortMessage || e.message}`, { id: toastId });
        }
    }

    const stake = (amount: string, tierId: number) => {
        if (!amount || Number(amount) <= 0 || !Number.isInteger(tierId) || tierId < 0) {
            toast.error("Invalid amount or tier ID."); return;
        }
        executeStakingTask('stake', [parseUnits(amount, 18), BigInt(tierId)], 'stake-toast');
    };
    
    const unstake = (positionId: number) => executeStakingTask('unstake', [BigInt(positionId)], 'unstake-toast');
    const claimRewards = (positionId: number) => executeStakingTask('claimRewards', [BigInt(positionId)], 'claim-toast');

    const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({ hash });

    // CORRECTED: Use useEffect to handle side-effects
    useEffect(() => {
        if (isSuccess) {
            toast.success('Staking transaction confirmed!');
            refetchPositionsCount(); // Refetch user data after a successful tx
        }
        if (isError) {
            toast.error('Staking transaction failed.');
        }
    }, [isSuccess, isError, refetchPositionsCount]);

    return { stake, unstake, claimRewards, userPositionsCount, isLoading: isPending || isConfirming };
};