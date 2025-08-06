// src/hooks/useIsVestingFactoryOwner.ts

"use client";
import { useAccount, useReadContract } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Abi, Address } from "viem";

/**
 * Checks if the currently connected entity (expected to be the Safe contract itself) 
 * is the owner of the VestingFactory contract. This hook is designed to work
 * within the Safe App context.
 */
export const useIsVestingFactoryOwner = () => {
  const { address: connectedAddress, chainId } = useAccount();

  const vestingFactoryAddress = chainId 
    ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.VestingFactory 
    : undefined;

  const { data: factoryOwner, isLoading } = useReadContract({
    address: vestingFactoryAddress,
    abi: pREWAAbis.VestingFactory,
    functionName: 'owner',
    query: { 
      enabled: !!vestingFactoryAddress 
    }
  });

  const isOwner = !!connectedAddress &&
                  !!factoryOwner &&
                  typeof factoryOwner === 'string' &&
                  connectedAddress.toLowerCase() === factoryOwner.toLowerCase();

  return { 
    isOwner, 
    isLoading
  };
};