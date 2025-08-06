// src/hooks/useReadLPStakingPositions.ts

"use client";

import { useAccount, useReadContracts } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Abi, Address } from "viem";
import { useMemo } from "react";

export interface LPStakingPositionDetails {
  positionId: bigint;
  amount: bigint;
  startTime: bigint;
  endTime: bigint;
  tierId: bigint;
  lpToken: Address;
  active: boolean;
  pendingRewards: bigint;
  expectedRewards: bigint;
  earlyWithdrawalPenalty: bigint;
}

const SECONDS_PER_YEAR = 31536000n;
const BPS_MAX = 10000n;

export const useReadLPStakingPositions = () => {
  const { address, chainId } = useAccount();

  const lpStakingContract = {
    address: chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LPStaking : undefined,
    abi: pREWAAbis.LPStaking as Abi,
  };

  const { data: positionCount } = useReadContracts({
    contracts: [{
        ...lpStakingContract,
        functionName: "getLPPositionCount",
        args: [address!],
    }],
    query: {
      enabled: !!address && !!lpStakingContract.address,
      select: (data) => (data[0].status === "success" ? (data[0].result as bigint) : 0n),
    },
  });

  const positionDetailCalls = useMemo(() => {
    if (!address || !positionCount || positionCount === 0n) return [];
    return Array.from({ length: Number(positionCount) }, (_, i) => ({
      ...lpStakingContract,
      functionName: "getLPStakingPosition",
      args: [address!, BigInt(i)],
    }));
  }, [positionCount, address, lpStakingContract.address]);
  
  const { data: positionsData, isLoading: isLoadingPositions } = useReadContracts({
    contracts: positionDetailCalls,
    query: {
      enabled: !!positionCount && positionCount > 0n,
    },
  });

  const dependentDataCalls = useMemo(() => {
    if (!positionsData) return [];

    const uniqueTierIds = new Set<bigint>();
    const rewardCalls: any[] = [];
    const poolInfoCalls = new Map<Address, any>();

    positionsData.forEach((posResult, i) => {
      if (posResult.status === 'success') {
        const [, , , , tierId, lpToken] = posResult.result as any;
        uniqueTierIds.add(tierId);
        if (!poolInfoCalls.has(lpToken)) {
            poolInfoCalls.set(lpToken, {
                ...lpStakingContract, functionName: 'getPoolInfo', args: [lpToken],
            });
        }
        rewardCalls.push({
          ...lpStakingContract, functionName: 'calculateLPRewards', args: [address!, BigInt(i)],
        });
      }
    });
    
    const tierInfoCalls = Array.from(uniqueTierIds).map(tierId => ({
      ...lpStakingContract, functionName: 'getTierInfo', args: [tierId],
    }));

    return [...tierInfoCalls, ...Array.from(poolInfoCalls.values()), ...rewardCalls];
  }, [positionsData, lpStakingContract, address]);


  const { data: dependentData, isLoading: isLoadingDependents, isError, refetch } = useReadContracts({
    contracts: dependentDataCalls,
    query: {
      enabled: !!positionsData && positionsData.length > 0,
    },
  });

  const positions: LPStakingPositionDetails[] = useMemo(() => {
    if (!positionsData || !dependentData || !positionCount) return [];

    const uniqueTierIds = new Set<bigint>();
    positionsData.forEach(p => {
        if(p.status === 'success') uniqueTierIds.add((p.result as any)[4])
    });

    const uniqueLpTokens = new Map<Address, any>();
     positionsData.forEach(p => {
        if(p.status === 'success') {
            const lpToken = (p.result as any)[5];
            if (!uniqueLpTokens.has(lpToken)) uniqueLpTokens.set(lpToken, {});
        }
    });

    const tierInfoMap = new Map<bigint, any>();
    dependentData.slice(0, uniqueTierIds.size).forEach((result, index) => {
        if(result.status === 'success') {
            const tierId = (dependentDataCalls[index] as any).args[0] as bigint;
            tierInfoMap.set(tierId, result.result);
        }
    });

    const poolInfoMap = new Map<Address, any>();
    dependentData.slice(uniqueTierIds.size, uniqueTierIds.size + uniqueLpTokens.size).forEach((result, index) => {
        if(result.status === 'success') {
            const lpToken = (dependentDataCalls[uniqueTierIds.size + index] as any).args[0] as Address;
            poolInfoMap.set(lpToken, result.result);
        }
    });

    const rewardResults = dependentData.slice(uniqueTierIds.size + uniqueLpTokens.size);

    return (positionsData.map((positionResult, i) => {
        if (positionResult.status !== "success" || !rewardResults[i] || rewardResults[i].status !== "success") return null;

        const [amount, startTime, endTime, , tierId, lpToken, active] = positionResult.result as any;
        const pendingRewards = rewardResults[i].result as bigint;
        const tierInfo = tierInfoMap.get(tierId);
        const poolInfo = poolInfoMap.get(lpToken);

        if (tierInfo && poolInfo) {
            const [duration, rewardMultiplier, earlyWithdrawalPenalty] = tierInfo;
            const [baseAPRBps] = poolInfo;
            // FIX: Ensure all parts of the calculation are BigInt
            const expectedRewards = (amount * BigInt(baseAPRBps) * BigInt(duration) * BigInt(rewardMultiplier)) / (BPS_MAX * SECONDS_PER_YEAR * BPS_MAX);
            
            return {
                positionId: BigInt(i), amount, startTime, endTime, tierId, lpToken, active,
                pendingRewards, expectedRewards, earlyWithdrawalPenalty,
            };
        }
        return null;
    }).filter(p => p !== null) as LPStakingPositionDetails[]).sort((a, b) => Number(b.positionId - a.positionId));
  }, [positionsData, dependentData, positionCount, dependentDataCalls]);
  
  return {
    positions,
    isLoading: (isLoadingPositions || isLoadingDependents) && !!positionCount && positionCount > 0n,
    isError,
    refetch,
  };
};