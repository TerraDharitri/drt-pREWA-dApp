// src/hooks/useStaking.ts

"use client";
import { useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { pREWAAddresses, pREWAAbis } from '@/constants';
import { parseUnits, BaseError } from 'viem';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export const useStaking = () => {
  const { address, chainId } = useAccount();
  const stakingContractAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.TokenStaking : undefined;
  
  const queryClient = useQueryClient();
  const toastIdRef = useRef<string | undefined>();
  const actionRef = useRef<string>('');

  const { data: hash, writeContractAsync, isPending, error: writeError, reset } = useWriteContract();

  const stake = async (amount: string, tierId: number) => {
    if (!stakingContractAddress) return toast.error("Staking contract not found on this network.");
    const amountInWei = parseUnits(amount, 18);

    actionRef.current = 'Stake';
    toastIdRef.current = toast.loading('Waiting for staking signature...');
    
    try {
      await writeContractAsync({
        address: stakingContractAddress,
        abi: pREWAAbis.TokenStaking,
        functionName: 'stake',
        args: [amountInWei, BigInt(tierId)],
      });
    } catch (e: any) {
      const errorMsg = e instanceof BaseError ? e.shortMessage : (e.message || "Staking transaction rejected.");
      toast.error(errorMsg, { id: toastIdRef.current });
      toastIdRef.current = undefined;
    }
  };
  
  const unstake = async (positionId: string) => {
    if (!stakingContractAddress) return toast.error("Staking contract not found on this network.");

    actionRef.current = 'Unstake';
    toastIdRef.current = toast.loading('Waiting for unstake signature...');
    
    try {
      await writeContractAsync({
        address: stakingContractAddress,
        abi: pREWAAbis.TokenStaking,
        functionName: 'unstake',
        args: [BigInt(positionId)],
      });
    } catch (e: any) {
      const errorMsg = e instanceof BaseError ? e.shortMessage : (e.message || "Unstake transaction rejected.");
      toast.error(errorMsg, { id: toastIdRef.current });
      toastIdRef.current = undefined;
    }
  };

  const claimRewards = async (positionId: string) => {
    if (!stakingContractAddress) return toast.error("Staking contract not found on this network.");
    
    actionRef.current = 'Claim Rewards';
    toastIdRef.current = toast.loading('Waiting for claim signature...');

    try {
      await writeContractAsync({
        address: stakingContractAddress,
        abi: pREWAAbis.TokenStaking,
        functionName: 'claimRewards',
        args: [BigInt(positionId)],
      });
    } catch (e: any) {
      const errorMsg = e instanceof BaseError ? e.shortMessage : (e.message || "Claim transaction rejected.");
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


  return {
    stake,
    unstake,
    claimRewards,
    isLoading: isPending || isConfirming,
  };
};