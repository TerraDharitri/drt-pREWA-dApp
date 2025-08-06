// src/hooks/useVestingAdminStatus.ts

"use client";
import { useAccount, useReadContract } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Address } from "viem";
import { useSafe } from "@/providers/SafeProvider";

/**
 * Provides a comprehensive status for vesting administration.
 * Returns:
 * - isOwner: True if the connected EOA is a signer for the Safe that owns the VestingFactory.
 * - isSafeContext: True if the dApp is currently running inside a Safe App iframe.
 * - isLoading: True while fetching on-chain data.
 */
export const useVestingAdminStatus = () => {
  const { address: connectedAddress, chainId } = useAccount();
  const { isSafe: isSafeContext } = useSafe();

  const addresses = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses] : undefined;
  const vestingFactoryAddress = addresses?.VestingFactory;
  const adminSafeAddress = addresses?.ProtocolAdminSafe;

  const { data: factoryOwner, isLoading: isLoadingFactoryOwner } = useReadContract({
    address: vestingFactoryAddress,
    abi: pREWAAbis.VestingFactory,
    functionName: 'owner',
    query: { enabled: !!vestingFactoryAddress }
  });

  const isSafeTheFactoryOwner = !!factoryOwner &&
                                !!adminSafeAddress &&
                                typeof factoryOwner === 'string' &&
                                factoryOwner.toLowerCase() === adminSafeAddress.toLowerCase();

  const { data: safeOwners, isLoading: isLoadingSafeOwners } = useReadContract({
    address: adminSafeAddress,
    abi: pREWAAbis.Safe,
    functionName: 'getOwners',
    query: { enabled: isSafeTheFactoryOwner && !!connectedAddress }
  });

  const isOwner = !!connectedAddress &&
                  !!safeOwners &&
                  safeOwners.some((owner: Address) => owner.toLowerCase() === connectedAddress.toLowerCase());

  return { 
    isOwner: isOwner && isSafeTheFactoryOwner, 
    isSafeContext,
    isLoading: isLoadingFactoryOwner || isLoadingSafeOwners
  };
};