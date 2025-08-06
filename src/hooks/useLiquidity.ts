// src/hooks/useLiquidity.ts

"use client";
import { useEffect, useRef, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { pREWAAddresses, pREWAAbis } from '@/constants';
import { Address, parseUnits, decodeEventLog, BaseError, isAddress } from 'viem';
import toast from 'react-hot-toast';
import { useQueryClient } from "@tanstack/react-query";

interface LiquiditySuccessData {
    lpReceived: bigint;
    otherToken: Address;
}

interface UseLiquidityOptions {
    onSuccess?: (data: LiquiditySuccessData) => void;
    onRemoveSuccess?: () => void;
}

type LiquidityAddedArgs = {
    liquidityReceived: bigint;
    otherToken: Address;
};

function isLiquidityAddedArgs(args: any): args is LiquidityAddedArgs {
    return (
        args !== null &&
        typeof args === 'object' &&
        typeof args.liquidityReceived === 'bigint' &&
        typeof args.otherToken === 'string' &&
        isAddress(args.otherToken)
    );
}

export const useLiquidity = ({ onSuccess, onRemoveSuccess }: UseLiquidityOptions = {}) => {
  const { address, chainId } = useAccount();
  const queryClient = useQueryClient();
  const toastIdRef = useRef<string | undefined>();
  const actionRef = useRef<string>('');

  const liquidityManagerAddress = chainId
    ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LiquidityManager
    : undefined;
  
  const { data: hash, writeContractAsync, isPending, error: writeError, reset } = useWriteContract();
  
  const addLiquidity = useCallback(async (otherToken: Address, pREWAAmount: string, otherAmount: string) => {
    if (!liquidityManagerAddress) return toast.error("Liquidity Manager not found on this network.");
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
    const pREWAMin = parseUnits(pREWAAmount, 18) * 995n / 1000n;
    const otherMin = parseUnits(otherAmount, 18) * 995n / 1000n;

    actionRef.current = 'Add Liquidity';
    toastIdRef.current = toast.loading("Waiting for signature...");
    try {
      await writeContractAsync({
        address: liquidityManagerAddress,
        abi: pREWAAbis.LiquidityManager,
        functionName: 'addLiquidity',
        args: [otherToken, parseUnits(pREWAAmount, 18), parseUnits(otherAmount, 18), pREWAMin, otherMin, deadline],
      });
    } catch (e: any) {
      const errorMsg = e instanceof BaseError ? e.shortMessage : (e.message || "Transaction rejected.");
      toast.error(errorMsg, { id: toastIdRef.current });
      toastIdRef.current = undefined;
    }
  }, [liquidityManagerAddress, writeContractAsync]);
  
  // FIX: Added wethAddress as a required parameter
  const addLiquidityBNB = useCallback(async (pREWAAmount: string, bnbAmount: string) => {
    if (!liquidityManagerAddress) return toast.error("Liquidity Manager not found on this network.");
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
    const pREWAMin = parseUnits(pREWAAmount, 18) * 995n / 1000n;
    const bnbMin = parseUnits(bnbAmount, 18) * 995n / 1000n;

    actionRef.current = 'Add Liquidity';
    toastIdRef.current = toast.loading("Waiting for signature...");
    try {
      await writeContractAsync({
        address: liquidityManagerAddress,
        abi: pREWAAbis.LiquidityManager,
        functionName: 'addLiquidityBNB',
        args: [parseUnits(pREWAAmount, 18), pREWAMin, bnbMin, deadline],
        value: parseUnits(bnbAmount, 18),
      });
    } catch (e: any) {
      const errorMsg = e instanceof BaseError ? e.shortMessage : (e.message || "Transaction rejected.");
      toast.error(errorMsg, { id: toastIdRef.current });
      toastIdRef.current = undefined;
    }
  }, [liquidityManagerAddress, writeContractAsync]);

  const removeLiquidity = useCallback(async (otherToken: Address, lpAmount: string) => {
    if (!liquidityManagerAddress) return toast.error("Liquidity Manager not found.");
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
    const amount = parseUnits(lpAmount, 18);

    actionRef.current = 'Remove Liquidity';
    toastIdRef.current = toast.loading("Waiting for signature...");
    try {
      await writeContractAsync({
        address: liquidityManagerAddress,
        abi: pREWAAbis.LiquidityManager,
        functionName: 'removeLiquidity',
        args: [otherToken, amount, 1n, 1n, deadline],
      });
    } catch (e: any) {
      const errorMsg = e instanceof BaseError ? e.shortMessage : (e.message || "Transaction rejected.");
      toast.error(errorMsg, { id: toastIdRef.current });
      toastIdRef.current = undefined;
    }
  }, [liquidityManagerAddress, writeContractAsync]);

  const removeLiquidityBNB = useCallback(async (lpAmount: string) => {
    if (!liquidityManagerAddress) return toast.error("Liquidity Manager not found.");
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
    const amount = parseUnits(lpAmount, 18);

    actionRef.current = 'Remove Liquidity';
    toastIdRef.current = toast.loading("Waiting for signature...");
    try {
      await writeContractAsync({
        address: liquidityManagerAddress,
        abi: pREWAAbis.LiquidityManager,
        functionName: 'removeLiquidityBNB',
        args: [amount, 1n, 1n, deadline],
      });
    } catch (e: any) {
      const errorMsg = e instanceof BaseError ? e.shortMessage : (e.message || "Transaction rejected.");
      toast.error(errorMsg, { id: toastIdRef.current });
      toastIdRef.current = undefined;
    }
  }, [liquidityManagerAddress, writeContractAsync]);

  const { isLoading: isConfirming, isSuccess, data: receipt, isError, error: receiptError } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    const toastId = toastIdRef.current;
    if (!hash || !toastId) return;

    const actionInProgress = actionRef.current;

    if (isConfirming) {
      toast.loading(`Processing ${actionInProgress}...`, { id: toastId });
    } else if (isSuccess && receipt) {
      toast.success(`${actionInProgress} successful!`, { id: toastId });
      
      queryClient.invalidateQueries();
      
      if (actionInProgress === 'Add Liquidity') {
          try {
            for (const log of receipt.logs) {
                if (log.address.toLowerCase() === liquidityManagerAddress?.toLowerCase()) {
                    const decodedLog = decodeEventLog({ abi: pREWAAbis.LiquidityManager, data: log.data, topics: log.topics });
                    if (decodedLog.eventName === 'LiquidityAdded' && isLiquidityAddedArgs(decodedLog.args)) {
                        if (onSuccess) {
                           onSuccess({ lpReceived: decodedLog.args.liquidityReceived, otherToken: decodedLog.args.otherToken });
                        }
                        break; 
                    }
                }
            }
          } catch (e) { console.error("Failed to parse logs for LP amount:", e); }
      } else if (actionInProgress === 'Remove Liquidity') {
        if(onRemoveSuccess) onRemoveSuccess();
      }
      
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
  }, [isConfirming, isSuccess, isError, hash, receipt, reset, queryClient, onSuccess, onRemoveSuccess, liquidityManagerAddress, receiptError, writeError]);
  
  return { addLiquidity, addLiquidityBNB, removeLiquidity, removeLiquidityBNB, isLoading: isPending || isConfirming };
};