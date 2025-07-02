"use client";

import { useAccount, useReadContract } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useStaking } from "@/hooks/useStaking";
import { pREWAAbis, pREWAAddresses } from "@/constants";
import { formatBigInt } from "@/lib/web3-utils";
import { Address } from "viem";

interface StakingPositionCardProps {
  positionId: number;
  userAddress: Address;
}

export function StakingPositionCard({ positionId, userAddress }: StakingPositionCardProps) {
  const { chainId } = useAccount();
  const contractAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.TokenStaking : undefined;
  
  const { unstake, claimRewards, isLoading: isActionLoading } = useStaking();

  const { data: positionData, isLoading: isPositionLoading } = useReadContract({
    address: contractAddress,
    abi: pREWAAbis.TokenStaking,
    functionName: 'getStakingPosition',
    args: [userAddress, BigInt(positionId)],
    query: {
        enabled: !!userAddress && !!contractAddress,
    }
  });
  
  const isPositionActive = Array.isArray(positionData) && positionData.length > 5 && positionData[5] === true;

  const { data: rewards, isLoading: isRewardsLoading } = useReadContract({
    address: contractAddress,
    abi: pREWAAbis.TokenStaking,
    functionName: 'calculateRewards',
    args: [userAddress, BigInt(positionId)],
    query: {
        enabled: isPositionActive,
        refetchInterval: 5000,
    }
  });

  if (isPositionLoading) {
    return <Card className="bg-gray-100 h-64"><CardContent className="p-4 flex justify-center items-center h-full"><Spinner /></CardContent></Card>;
  }

  if (!isPositionActive) {
    return null; 
  }

  const [amount, startTime, endTime, lastClaimTime, tierId, active] = positionData;

  const isMature = new Date() > new Date(Number(endTime) * 1000);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Position #{positionId}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p><strong>Amount:</strong> {formatBigInt(amount)} pREWA</p>
        <p><strong>Tier ID:</strong> {tierId.toString()}</p>
        <p><strong>Status:</strong> <span className={isMature ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>{isMature ? 'Mature' : 'Staking'}</span></p>
        <p><strong>End Time:</strong> {new Date(Number(endTime) * 1000).toLocaleString()}</p>
        
        <div className="bg-blue-50 p-3 rounded-md">
          <p className="font-semibold text-sm">Pending Rewards:</p>
          {/* CORRECTED: Explicitly cast the 'unknown' rewards type to 'bigint | undefined' before passing to the formatter. */}
          <p className="text-xl font-bold text-blue-700">{isRewardsLoading ? 'Calculating...' : formatBigInt(rewards as bigint | undefined)} pREWA</p>
        </div>

        <div className="flex gap-2 pt-2">
            <Button onClick={() => unstake(positionId)} variant="destructive" size="sm" disabled={isActionLoading}>
                {isActionLoading && <Spinner className="mr-2 h-4 w-4" />}
                Unstake
            </Button>
            <Button onClick={() => claimRewards(positionId)} variant="outline" size="sm" disabled={isActionLoading || !rewards || rewards === 0n}>
                {isActionLoading && <Spinner className="mr-2 h-4 w-4" />}
                Claim Rewards
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}