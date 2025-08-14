// src/hooks/useLiquidity.ts
"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Address, BaseError, Abi, parseUnits } from "viem";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";
import { useEffect, useRef } from "react";
import { TOKEN_LISTS } from "@/constants/tokens";

interface UseLiquidityProps {
  onAddSuccess?: () => void;
  onRemoveSuccess?: () => void;
}

export const useLiquidity = ({ onAddSuccess, onRemoveSuccess }: UseLiquidityProps = {}) => {
  const { address, chainId } = useAccount();
  const toastIdRef = useRef<string | undefined>();

  const {
    data: hash,
    writeContract,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const liquidityManagerAddress = chainId
    ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LiquidityManager
    : undefined;

  const handleTransaction = (
    action: 'addLiquidity' | 'addLiquidityBNB' | 'removeLiquidity' | 'removeLiquidityBNB',
    args: any[],
    payableValue?: bigint
  ) => {
    if (!liquidityManagerAddress) {
      toast.error("Liquidity Manager not found for this chain.");
      return;
    }
    toastIdRef.current = toast.loading("Waiting for signature...");
    writeContract({
      address: liquidityManagerAddress,
      abi: pREWAAbis.LiquidityManager as Abi,
      functionName: action,
      args: args,
      value: payableValue,
    });
  };

  // FIX: Corrected the function signature to accept only the necessary arguments
  const addLiquidity = (tokenA: Address, tokenB: Address, amountADesired: string) => {
    const tokens = TOKEN_LISTS[chainId as keyof typeof TOKEN_LISTS] || [];
    const tokenADecimals = tokens.find(t => t.address.toLowerCase() === tokenA.toLowerCase())?.decimals || 18;
    
    handleTransaction('addLiquidity', [
      tokenA,
      tokenB,
      parseUnits(amountADesired, tokenADecimals),
      0, // amountBDesired is calculated by the contract
      0, // amountAMin (0 for simplicity, could be made more robust)
      0, // amountBMin
      BigInt(Math.floor(Date.now() / 1000) + 60 * 20) // 20-minute deadline
    ]);
  };
  
  // FIX: Corrected the function signature
  const addLiquidityBNB = (token: Address, amountTokenDesired: string) => {
     const tokens = TOKEN_LISTS[chainId as keyof typeof TOKEN_LISTS] || [];
     const tokenDecimals = tokens.find(t => t.address.toLowerCase() === token.toLowerCase())?.decimals || 18;
    
     handleTransaction('addLiquidityBNB', [
      token,
      parseUnits(amountTokenDesired, tokenDecimals),
      0, // amountTokenMin
      0, // amountETHMin
      address,
      BigInt(Math.floor(Date.now() / 1000) + 60 * 20)
    ]);
  };

  const removeLiquidity = (otherToken: Address, lpAmount: string) => {
    handleTransaction('removeLiquidity', [
      otherToken,
      parseUnits(lpAmount, 18), // LP tokens usually have 18 decimals
      0, // pREWAMin
      0, // otherMin
      BigInt(Math.floor(Date.now() / 1000) + 60 * 20)
    ]);
  };
  
  const removeLiquidityBNB = (lpAmount: string) => {
      handleTransaction('removeLiquidityBNB', [
      parseUnits(lpAmount, 18),
      0, // pREWAMin
      0, // bnbMin
      BigInt(Math.floor(Date.now() / 1000) + 60 * 20)
    ]);
  };


  const { isLoading: isConfirming, isSuccess, isError, error: receiptError } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    const id = toastIdRef.current;
    if (!hash || !id) return;

    if (isConfirming) {
      toast.loading("Processing transaction...", { id });
    } else if (isSuccess) {
      toast.success("Transaction successful!", { id });
      if (onAddSuccess) onAddSuccess();
      if (onRemoveSuccess) onRemoveSuccess();
      reset();
      toastIdRef.current = undefined;
    } else if (isError) {
      const finalError = receiptError || error;
      let msg = "Transaction failed.";
      if (finalError) {
        if (finalError instanceof BaseError) {
          msg = finalError.shortMessage;
        } else if (finalError instanceof Error) {
          msg = finalError.message;
        }
      }
      toast.error(msg, { id });
      reset();
      toastIdRef.current = undefined;
    }
  }, [hash, isConfirming, isSuccess, isError, receiptError, error, reset, onAddSuccess, onRemoveSuccess]);

  return { 
    addLiquidity, 
    addLiquidityBNB,
    removeLiquidity,
    removeLiquidityBNB,
    isLoading: isPending || isConfirming 
  };
};