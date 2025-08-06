// src/hooks/useIsVestingFactoryOwner.ts

"use client";
import { useAccount, useReadContract } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Abi, Address } from "viem";
import { useSafe } from "@/providers/SafeProvider";
import { safeAbi } from "@/contracts/abis/Safe"; // Import the typed ABI directly

export const useIsVestingFactoryOwner = () => {
  const { address: connectedAddress, chainId } = useAccount();
  const { isSafe: isSafeContext, safe } = useSafe();

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
    abi: safeAbi, // FIX: Use the directly imported, strongly-typed ABI
    functionName: 'getOwners',
    query: { enabled: isSafeTheFactoryOwner && !!connectedAddress }
  });

  const isConnectedAddressASafeOwner = !!connectedAddress &&
                                       !!safeOwners &&
                                       // This will now compile correctly because `safeOwners` is known to be an array
                                       safeOwners.some((owner: Address) => owner.toLowerCase() === connectedAddress.toLowerCase());

  const isOwner = isSafeTheFactoryOwner && isConnectedAddressASafeOwner;

  return { 
    isOwner, 
    isLoading: isLoadingFactoryOwner || isLoadingSafeOwners
  };
};