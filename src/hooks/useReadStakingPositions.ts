"use client";
import { useAccount, useReadContracts } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Abi } from "viem";
import { useMemo } from "react";

// Define a type for the combined staking position data for better type safety
export interface StakingPositionDetails {
  positionId: bigint;
  amount: bigint;
  startTime: bigint;
  endTime: bigint;
  tierId: bigint;
  active: boolean;
  pendingRewards: bigint;
  expectedRewards: bigint;
  earlyWithdrawalPenalty: bigint; // <-- FIX: Add penalty property
}

// Constants for calculation
const SECONDS_PER_YEAR = 31536000n; // 365 days
const BPS_MAX = 10000n;

export const useReadStakingPositions = () => {
  const { address, chainId } = useAccount();

  const stakingContract = {
    address: chainId
      ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.TokenStaking
      : undefined,
    abi: pREWAAbis.TokenStaking as Abi,
  };

  // QUERY 1: Fetch the total number of staking positions for the connected user.
  const { data: positionCount } = useReadContracts({
    contracts: [
      {
        ...stakingContract,
        functionName: "getPositionCount",
        args: [address!],
      },
    ],
    query: {
      enabled: !!address && !!stakingContract.address,
      select: (data) => (data[0].status === "success" ? (data[0].result as bigint) : 0n),
    },
  });

  // QUERY 2: Fetch the core details for each staking position.
  const positionDetailCalls = useMemo(() => {
    if (!address || !positionCount || positionCount === 0n) return [];
    const calls = [];
    for (let i = 0; i < Number(positionCount); i++) {
      calls.push({
        ...stakingContract,
        functionName: "getStakingPosition",
        args: [address!, BigInt(i)],
      });
    }
    return calls;
  }, [positionCount, address, stakingContract.address]);

  const { data: positionsData, isLoading: isLoadingPositions } = useReadContracts({
    contracts: positionDetailCalls,
    query: {
      enabled: !!positionCount && positionCount > 0,
    },
  });

  // QUERY 3: Once we have position details, fetch all dependent data (rewards, tier info, base APR).
  const dependentDataCalls = useMemo(() => {
    if (!positionsData) return [];

    const uniqueTierIds = new Set<bigint>();
    const rewardCalls = [];

    for (let i = 0; i < positionsData.length; i++) {
      const posResult = positionsData[i];
      if (posResult.status === 'success') {
        const [, , , , tierId] = posResult.result as readonly [bigint, bigint, bigint, bigint, bigint, boolean];
        uniqueTierIds.add(tierId);
        rewardCalls.push({
          ...stakingContract,
          functionName: 'calculateRewards',
          args: [address!, BigInt(i)],
        });
      }
    }

    const tierInfoCalls = Array.from(uniqueTierIds).map(tierId => ({
      ...stakingContract,
      functionName: 'getTierInfo',
      args: [tierId],
    }));

    return [
      { ...stakingContract, functionName: 'getBaseAnnualPercentageRate' },
      ...tierInfoCalls,
      ...rewardCalls,
    ];
  }, [positionsData, stakingContract.address, address]);

  const { data: dependentData, isLoading: isLoadingDependents, isError, refetch } = useReadContracts({
    contracts: dependentDataCalls,
    query: {
      enabled: !!positionsData && positionsData.length > 0,
    },
  });

  // FINAL STEP: Combine and process all fetched data.
  const positions: StakingPositionDetails[] = useMemo(() => {
    if (!positionsData || !dependentData || dependentData.length === 0) {
      return [];
    }
    
    const baseAprResult = dependentData[0];
    if (baseAprResult?.status !== 'success') return [];
    const baseAPRBps = baseAprResult.result as bigint;

    const tierInfoMap = new Map<bigint, any>();
    const uniqueTierIds = new Set<bigint>();
    positionsData.forEach(p => {
        if(p.status === 'success') uniqueTierIds.add((p.result as any)[4])
    });
    const tierInfoResults = dependentData.slice(1, 1 + uniqueTierIds.size);
    
    tierInfoResults.forEach((result, index) => {
        if(result.status === 'success') {
            const tierId = (dependentDataCalls[index + 1] as any).args[0] as bigint;
            tierInfoMap.set(tierId, result.result);
        }
    });

    const rewardResults = dependentData.slice(1 + uniqueTierIds.size);

    const processedPositions: StakingPositionDetails[] = [];
    for (let i = 0; i < Number(positionCount); i++) {
      const positionResult = positionsData[i];
      const rewardsResult = rewardResults[i];

      if (positionResult?.status === "success" && rewardsResult?.status === "success") {
        const [amount, startTime, endTime, , tierId, active] = positionResult.result as readonly [bigint, bigint, bigint, bigint, bigint, boolean];
        const pendingRewards = rewardsResult.result as bigint;
        const tierInfo = tierInfoMap.get(tierId);

        if (tierInfo) {
          const [duration, rewardMultiplier, earlyWithdrawalPenalty] = tierInfo as readonly [bigint, bigint, bigint, boolean];
          
          const expectedRewards = (amount * baseAPRBps * duration * rewardMultiplier) / (BPS_MAX * SECONDS_PER_YEAR * BPS_MAX);

          processedPositions.push({
            positionId: BigInt(i),
            amount,
            startTime,
            endTime,
            tierId,
            active,
            pendingRewards,
            expectedRewards,
            earlyWithdrawalPenalty, // <-- FIX: Pass penalty data through
          });
        }
      }
    }
    return processedPositions.sort((a, b) => Number(b.positionId - a.positionId));
  }, [positionsData, dependentData, positionCount, dependentDataCalls]);

  return {
    positions,
    isLoading: (isLoadingPositions || isLoadingDependents) && !!positionCount && positionCount > 0,
    isError,
    refetch,
  };
};