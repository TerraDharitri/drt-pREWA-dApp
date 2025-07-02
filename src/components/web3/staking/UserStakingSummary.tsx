"use client";

import { useAccount, useReadContract } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Spinner } from "@/components/ui/Spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StakingPositionCard } from "./StakingPositionCard";

export function UserStakingSummary() {
  const { address, chainId } = useAccount();
  const contractAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.TokenStaking : undefined;
  
  const { data: positionCount, isLoading } = useReadContract({
      address: contractAddress,
      abi: pREWAAbis.TokenStaking,
      functionName: 'getPositionCount',
      args: [address!],
      query: { 
        enabled: !!address && !!contractAddress,
        refetchInterval: 30000, // Refetch count every 30s
      }
  });

  if (!address) return null;
  if (isLoading) return <Card><CardHeader><CardTitle>Your Staking Positions</CardTitle></CardHeader><CardContent><div className="flex justify-center"><Spinner /></div></CardContent></Card>;
  if (!positionCount || positionCount === 0n) {
      return (
          <Card>
              <CardHeader><CardTitle>Your Staking Positions</CardTitle></CardHeader>
              <CardContent>
                  <p>You have no active staking positions.</p>
              </CardContent>
          </Card>
      );
  }

  // Create an array from 0 to positionCount-1 to map over
  const positionIds = Array.from({ length: Number(positionCount) }, (_, i) => i);

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold">Your Staking Positions ({positionCount.toString()})</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {positionIds.map(id => (
                <StakingPositionCard key={id} positionId={id} userAddress={address} />
            ))}
        </div>
    </div>
  );
}