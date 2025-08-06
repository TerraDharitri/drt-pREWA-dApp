// src/hooks/useReadVestingSchedules.ts

"use client";
import { useAccount, useConfig } from "wagmi";
import { readContracts } from "wagmi/actions";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Abi, Address } from "viem";
import { useQuery } from "@tanstack/react-query";
import { useSafe } from "@/providers/SafeProvider";

export interface VestingScheduleDetails {
  id: Address;
  beneficiary: Address;
  totalAmount: bigint;
  startTime: bigint;
  cliffDuration: bigint;
  duration: bigint;
  releasedAmount: bigint;
  revocable: boolean;
  revoked: boolean;
  isOwner: boolean;
  releasableAmount: bigint;
}

export const useReadVestingSchedules = (isAdmin: boolean = false) => {
  const { address: eoaAddress, chainId } = useAccount();
  const { safe, isSafe } = useSafe();
  const wagmiConfig = useConfig();

  const primaryAddress = isSafe ? safe?.safeAddress : eoaAddress;

  const getVestingFactoryConfig = () => {
      if (!chainId) return undefined;
      const address = pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.VestingFactory;
      if (!address) return undefined;
      return { address, abi: pREWAAbis.VestingFactory as Abi };
  }
  
  const vestingFactory = getVestingFactoryConfig();
  
  const queryKey = ['vestingSchedules', chainId, eoaAddress, isAdmin, safe?.safeAddress];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
        // FIX: Add a guard to ensure vestingFactory is defined before proceeding.
        if ((!primaryAddress && !isAdmin) || !vestingFactory?.address) return [];

        let uniqueScheduleAddresses: Address[] = [];

        if (isAdmin) {
            const pageSize = 100;
            let offset = 0;
            let total = 0;
            let hasMore = true;
            
            while(hasMore) {
                const result = await readContracts(wagmiConfig, {
                    contracts: [{ ...vestingFactory, functionName: 'getAllVestingContractsPaginated', args: [BigInt(offset), BigInt(pageSize)] }]
                });

                if (result[0].status === 'success') {
                    const [page, totalCount] = result[0].result as [Address[], bigint];
                    uniqueScheduleAddresses.push(...page);
                    total = Number(totalCount);
                    offset += pageSize;
                    hasMore = uniqueScheduleAddresses.length < total;
                } else {
                    hasMore = false;
                }
            }

        } else if (primaryAddress) {
            const addressResults = await readContracts(wagmiConfig, {
                contracts: [
                { ...vestingFactory, functionName: 'getVestingsByOwner', args: [primaryAddress] },
                { ...vestingFactory, functionName: 'getVestingsByBeneficiary', args: [primaryAddress] },
                ]
            });
            const owned = (addressResults[0]?.status === 'success' ? addressResults[0].result : []) as Address[] || [];
            const beneficiary = (addressResults[1]?.status === 'success' ? addressResults[1].result : []) as Address[] || [];
            uniqueScheduleAddresses = Array.from(new Set([...owned, ...beneficiary]));
        }

        if (uniqueScheduleAddresses.length === 0) return [];
      
      const scheduleDetailContracts = uniqueScheduleAddresses.flatMap(contractAddress => ([
        { address: contractAddress, abi: pREWAAbis.IVesting as Abi, functionName: 'getVestingSchedule' },
        { address: contractAddress, abi: pREWAAbis.IVesting as Abi, functionName: 'releasableAmount' },
        { address: contractAddress, abi: pREWAAbis.IVesting as Abi, functionName: 'owner' },
      ]));
      
      const scheduleDetailsData = await readContracts(wagmiConfig, { contracts: scheduleDetailContracts, allowFailure: true });

      const schedules: VestingScheduleDetails[] = [];
      for (let i = 0; i < uniqueScheduleAddresses.length; i++) {
        const scheduleResult = scheduleDetailsData[i * 3];
        const releasableResult = scheduleDetailsData[i * 3 + 1];
        const ownerResult = scheduleDetailsData[i * 3 + 2];
        
        if (scheduleResult.status === 'success' && releasableResult.status === 'success' && ownerResult.status === 'success') {
          const [beneficiary, totalAmount, startTime, cliffDuration, duration, releasedAmount, revocable, revoked] = scheduleResult.result as any[];
          schedules.push({
            id: uniqueScheduleAddresses[i],
            beneficiary, totalAmount, startTime, cliffDuration, duration, releasedAmount, revocable, revoked,
            isOwner: ownerResult.result === primaryAddress, 
            releasableAmount: releasableResult.result as bigint,
          });
        }
      }
      return schedules.sort((a, b) => Number(b.startTime) - Number(a.startTime)); // Ensure correct sorting
    },
    enabled: !!vestingFactory?.address && (isAdmin || !!primaryAddress),
  });

  return { 
    schedules: data || [], 
    isLoading,
    isError,
    refetch
  };
};