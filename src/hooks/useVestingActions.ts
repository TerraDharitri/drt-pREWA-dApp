// src/hooks/useVestingActions.ts

"use client";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Address, BaseError, Abi, parseUnits } from "viem";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query"; // FIX: Import the query client

export const useVestingActions = () => {
  const { chainId } = useAccount();
  const toastIdRef = useRef<string | undefined>();
  const queryClient = useQueryClient(); // FIX: Get an instance of the query client

  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError, 
    reset,
  } = useWriteContract();

  const createVestingSchedule = async (
    beneficiary: Address,
    startTime: number,
    cliffSeconds: number,
    durationSeconds: number,
    isRevocable: boolean,
    amount: string
  ) => {
    
    const vestingFactoryAddress = chainId
      ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.VestingFactory
      : undefined;
    
    if (!vestingFactoryAddress) {
      toast.error("VestingFactory address not found for this chain.");
      return;
    }
    
    toastIdRef.current = toast.loading("Proposing vesting schedule...");

    writeContract({
      address: vestingFactoryAddress,
      abi: pREWAAbis.VestingFactory as Abi,
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
  };

  const releaseVestedTokens = async (vestingContractAddress: Address) => {
      if (!vestingContractAddress) {
          toast.error("Vesting contract address is invalid.");
          return;
      }
      
      toastIdRef.current = toast.loading("Releasing vested tokens...");

      writeContract({
          address: vestingContractAddress,
          abi: pREWAAbis.IVesting as Abi,
          functionName: 'release',
          args: [],
      });
  };
  
  const revokeVestingSchedule = async (vestingContractAddress: Address) => {
      if (!vestingContractAddress) {
          toast.error("Vesting contract address is invalid.");
          return;
      }
      
      toastIdRef.current = toast.loading("Revoking vesting schedule...");

      writeContract({
          address: vestingContractAddress,
          abi: pREWAAbis.IVesting as Abi,
          functionName: 'revoke',
          args: [],
      });
  };

  const { 
    isLoading: isConfirming, 
    isSuccess, 
    isError, 
    error: receiptError 
  } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (writeError) {
      const id = toastIdRef.current;
      const msg = writeError instanceof BaseError ? writeError.shortMessage : writeError.message;
      toast.error(msg, { id });
      toastIdRef.current = undefined;
      reset();
    }
  }, [writeError, reset]);

  useEffect(() => {
    const id = toastIdRef.current;
    if (!hash || !id) return;

    if (isConfirming) {
      toast.loading("Processing transaction...", { id });
    } else if (isSuccess) {
      toast.success("Transaction successful!", { id });
      // FIX: Invalidate the vestingSchedules query to trigger an automatic refetch
      queryClient.invalidateQueries({ queryKey: ['vestingSchedules'] });
      reset();
      toastIdRef.current = undefined;
    } else if (isError) {
      let errorMessage = "Transaction failed on-chain.";
      if (receiptError) {
        if (receiptError instanceof BaseError) {
          errorMessage = receiptError.shortMessage;
        } else if (receiptError instanceof Error) {
          errorMessage = receiptError.message;
        }
      }
      toast.error(errorMessage, { id });
      reset();
      toastIdRef.current = undefined;
    }
  }, [hash, isConfirming, isSuccess, isError, receiptError, writeError, reset, queryClient]);

  return { 
    createVestingSchedule, 
    releaseVestedTokens, 
    revokeVestingSchedule,
    isLoading: isPending || isConfirming 
  };
};