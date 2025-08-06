// src/hooks/useAdmin.ts

"use client";
import { useAccount, useReadContract } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Abi } from "viem";
import { useSafe } from "@/providers/SafeProvider";

/**
 * Checks if the connected account (EOA or Safe) has the DEFAULT_ADMIN_ROLE in the AccessControl contract.
 * This is the primary admin check for most of the dApp.
 */
export const useIsAdmin = () => {
  const { address: eoaAddress, chainId } = useAccount();
  const { safe, isSafe } = useSafe();

  // The address for the role check is the Safe's if connected via Safe, otherwise the user's EOA.
  const primaryAddress = isSafe ? safe?.safeAddress : eoaAddress;

  const accessControl = {
    address: chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.AccessControl : undefined,
    abi: pREWAAbis.AccessControl as Abi,
  };

  const { data: adminRole } = useReadContract({
    ...accessControl,
    functionName: 'DEFAULT_ADMIN_ROLE',
  });

  const { data: hasAdminRole, isLoading } = useReadContract({
    ...accessControl,
    functionName: 'hasRole',
    args: [adminRole!, primaryAddress!],
    query: {
      enabled: !!primaryAddress && !!adminRole,
    }
  });

  return { isAdmin: hasAdminRole, isLoading };
};