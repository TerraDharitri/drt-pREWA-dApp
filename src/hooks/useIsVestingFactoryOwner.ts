// src/hooks/useIsVestingFactoryOwner.ts

"use client";
import { useAccount, useReadContract } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Address } from "viem";
import { useMemo } from 'react';

/**
 * Checks if the currently connected address is the owner of the VestingFactory contract.
 * This is designed to work within the Safe App context where the connected address
 * will be the Safe's own address.
 */
export const useIsVestingFactoryOwner = () => {
  const { address: connectedAddress, chainId } = useAccount();

  const vestingFactoryAddress = chainId 
    ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.VestingFactory 
    : undefined;

  const { data: factoryOwner, isLoading, isSuccess } = useReadContract({
    address: vestingFactoryAddress,
    abi: pREWAAbis.VestingFactory,
    functionName: 'owner',
    query: { 
      // Only run the query if we have the necessary addresses
      enabled: !!vestingFactoryAddress && !!connectedAddress,
    }
  });

  // Use useMemo to prevent re-calculation on every render.
  // The logic is now a direct comparison.
  const isOwner = useMemo(() => {
    if (!isSuccess || !factoryOwner || !connectedAddress) {
      return false;
    }
    return (factoryOwner as Address).toLowerCase() === connectedAddress.toLowerCase();
  }, [isSuccess, factoryOwner, connectedAddress]);

  return { 
    isOwner, 
    isLoading
  };
};