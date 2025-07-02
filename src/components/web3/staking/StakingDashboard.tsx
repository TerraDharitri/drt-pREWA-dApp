
"use client";
import React, { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useStaking } from "@/hooks/useStaking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { formatUnits, parseUnits } from "viem";

export function StakingDashboard() {
  const { chainId } = useAccount();
  const contractAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.TokenStaking : undefined;
  const tokenAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.pREWAToken : undefined;
  
  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedTier, setSelectedTier] = useState(0);

  const { allowance, approve, isLoading: isApprovalLoading } = useTokenApproval(tokenAddress, contractAddress);
  const { stake, unstake, claimRewards, isLoading: isStakingLoading } = useStaking();
  
  const needsApproval = !allowance || allowance < parseUnits(stakeAmount || "0", 18);

  const handleStake = () => {
    if (needsApproval) {
      approve();
    } else {
      stake(stakeAmount, selectedTier);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader><CardTitle>Stake Your pREWA</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="tier" className="block text-sm font-medium mb-1">Staking Tier</label>
            <Input id="tier" type="number" value={selectedTier} onChange={(e) => setSelectedTier(parseInt(e.target.value))} placeholder="Enter Tier ID (e.g., 0)" />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-1">Amount to Stake</label>
            <Input id="amount" type="text" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="0.0 pREWA" />
          </div>
          <Button onClick={handleStake} disabled={isApprovalLoading || isStakingLoading || !stakeAmount} className="w-full">
            {(isApprovalLoading || isStakingLoading) && <Spinner className="mr-2 h-4 w-4" />}
            {needsApproval ? 'Approve' : 'Stake'}
          </Button>
        </CardContent>
      </Card>
      <UserStakingSummary />
    </div>
  );
}

function UserStakingSummary() {
    const { address, chainId } = useAccount();
    const contractAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.TokenStaking : undefined;
    
    const { data: positionCount, isLoading } = useReadContract({
        address: contractAddress,
        abi: pREWAAbis.TokenStaking,
        functionName: 'getPositionCount',
        args: [address!],
        query: { enabled: !!address }
    });

    if (isLoading) return <Card><CardContent><Spinner /></CardContent></Card>;
    if (!positionCount || positionCount === 0n) return <Card><CardHeader><CardTitle>Your Positions</CardTitle></CardHeader><CardContent><p>You have no active staking positions.</p></CardContent></Card>;

    return (
        <Card>
            <CardHeader><CardTitle>Your Positions ({positionCount.toString()})</CardTitle></CardHeader>
            <CardContent>
                {/* In a real app, you would fetch each position here */}
                <p>Position display logic would go here.</p>
                <p>Example: Position 0: 1000 pREWA in Tier 1</p>
                <div className="flex gap-2 mt-2">
                    <Button variant="secondary" size="sm" onClick={() => alert("Unstaking Position 0")}>Unstake</Button>
                    <Button variant="outline" size="sm" onClick={() => alert("Claiming from Position 0")}>Claim Rewards</Button>
                </div>
            </CardContent>
        </Card>
    );
}