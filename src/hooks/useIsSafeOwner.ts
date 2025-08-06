"use client";
import { useAccount, useReadContract } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Address } from "viem";
import { useMemo } from 'react'; // <-- FIX: Add the missing import for useMemo

export const useIsSafeOwner = () => {
  const { address: connectedAddress, chainId } = useAccount();

  const safeAddress = chainId 
    ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.ProtocolAdminSafe 
    : undefined;

  const { data, isSuccess, isLoading } = useReadContract({
    address: safeAddress,
    abi: pREWAAbis.Safe,
    functionName: 'getOwners',
    query: { 
      enabled: !!safeAddress && !!connectedAddress,
    }
  });

  const isOwner = useMemo(() => {
    if (!isSuccess || !connectedAddress || !data) {
      return false;
    }
    return data.some(owner => owner.toLowerCase() === connectedAddress.toLowerCase());
  }, [isSuccess, data, connectedAddress]);

  return { isOwner, isLoading };
};