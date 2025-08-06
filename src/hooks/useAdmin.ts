// src/hooks/useAdmin.ts
"use client";
import { useAccount, useReadContract } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Abi } from "viem";
import { useSafe } from "@/providers/SafeProvider";
import { useIsSafeOwner } from "./useIsSafeOwner";

export const useIsAdmin = () => {
  const { address: eoaAddress, chainId } = useAccount();
  const { safe, isSafe } = useSafe();

  const primaryAddress = isSafe ? safe?.safeAddress : eoaAddress;

  const accessControl = {
    address: chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.AccessControl : undefined,
    abi: pREWAAbis.AccessControl as Abi,
  };

  const { data: adminRole } = useReadContract({
    ...accessControl,
    functionName: 'DEFAULT_ADMIN_ROLE',
  });

  const { data: hasAdminRole, isLoading: isRoleLoading } = useReadContract({
    ...accessControl,
    functionName: 'hasRole',
    args: [adminRole!, primaryAddress!],
    query: {
      enabled: !!primaryAddress && !!adminRole,
    }
  });

  // Get the protocol admin safe address
  const protocolAdminSafeAddress = chainId 
    ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.ProtocolAdminSafe 
    : undefined;

  // Check if the current EOA is an owner of the protocol admin safe
  const { isOwner: isSafeOwner, isLoading: isSafeOwnerLoading } = useIsSafeOwner(
    protocolAdminSafeAddress as Address | undefined,
    eoaAddress as Address | undefined
  );

  // Condition 1: Direct admin role
  const isDirectAdmin = !!hasAdminRole;
  
  // Condition 2: Admin safe owner
  const isAdminViaSafe = !!protocolAdminSafeAddress && isSafeOwner;

  return { 
    isAdmin: isDirectAdmin || isAdminViaSafe, 
    isLoading: isRoleLoading || isSafeOwnerLoading 
  };
};