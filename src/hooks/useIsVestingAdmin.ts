// src/hooks/useIsVestingAdmin.ts

"use client";
import { useAccount, useReadContract } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Abi } from "viem";
import { useSafe } from "@/providers/SafeProvider";

/**
 * Checks if the connected account (EOA or Safe) has the DEFAULT_ADMIN_ROLE.
 * This role is required to create new vesting schedules.
 */
export const useIsVestingAdmin = () => {
  const { address: eoaAddress, chainId } = useAccount();
  const { safe, isSafe } = useSafe();

  const primaryAddress = isSafe ? safe?.safeAddress : eoaAddress;

  const accessControl = {
    address: chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.AccessControl : undefined,
    abi: pREWAAbis.AccessControl as Abi,
  };

  // 1. Get the admin role hash from the AccessControl contract.
  const { data: adminRole } = useReadContract({
    ...accessControl,
    functionName: 'DEFAULT_ADMIN_ROLE',
  });

  // 2. Check if the primary address (Safe or EOA) has the admin role.
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