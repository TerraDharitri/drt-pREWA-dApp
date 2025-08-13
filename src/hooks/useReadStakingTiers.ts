// src/hooks/useReadStakingTiers.ts
"use client";

import { useAccount, useReadContracts } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Abi, Address } from "viem";

export interface StakingTier {
  id: number;
  duration: number; // in days
  rewardMultiplier: number; // as a float, e.g., 1.25 for 1.25x
  earlyWithdrawalPenalty: number; // as a percentage, e.g., 15 for 15%
  isActive: boolean;
}

export const useReadStakingTiers = (
  contractType: 'TokenStaking' | 'LPStaking'
) => {
  const { chainId } = useAccount();

  const contractConfig = {
    address: chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.[contractType] : undefined,
    abi: pREWAAbis.TokenStaking as Abi, // Both contracts share the same tier ABI
  };

  const TIER_IDS = [0, 1, 2, 3];

  const { data, isLoading, isError } = useReadContracts({
    contracts: TIER_IDS.map(tierId => ({
      ...contractConfig,
      functionName: 'getTierInfo',
      args: [BigInt(tierId)],
    })),
    query: {
      enabled: !!contractConfig.address,
      select: (data) => {
        return data.map((item, index) => {
          if (item.status === 'success') {
            const [duration, rewardMultiplier, earlyWithdrawalPenalty, isActive] = item.result as [bigint, bigint, bigint, boolean];
            return {
              id: TIER_IDS[index],
              duration: Number(duration) / (60 * 60 * 24), // seconds to days
              rewardMultiplier: Number(rewardMultiplier) / 10000, // BPS to multiplier (10000 = 1x)
              earlyWithdrawalPenalty: Number(earlyWithdrawalPenalty) / 100, // BPS to percentage (100 = 1%)
              isActive,
            };
          }
          return null;
        }).filter((t): t is StakingTier => t !== null && t.isActive);
      }
    }
  });

  return {
    tiers: data || [],
    isLoading,
    isError,
  };
};