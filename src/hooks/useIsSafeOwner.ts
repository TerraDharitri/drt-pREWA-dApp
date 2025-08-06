// src/hooks/useIsSafeOwner.ts

"use client";
import { useAccount, useReadContract } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Abi, Address } from "viem";

export const useIsSafeOwner = () => {
  const { address: connectedAddress, chainId } = useAccount();

  const safeAddress = chainId 
    ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.ProtocolAdminSafe 
    : undefined;

  const { data: owners, isLoading } = useReadContract({
    address: safeAddress,
    abi: pREWAAbis.Safe as Abi,
    functionName: 'getOwners',
    query: { 
      enabled: !!safeAddress && !!connectedAddress,
    }
  });

  const isOwner = owners 
    ? owners.some(owner => owner.toLowerCase() === connectedAddress?.toLowerCase())
    : false;

  return { isOwner, isLoading };
};