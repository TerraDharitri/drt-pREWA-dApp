// src/components/web3/staking/StakingDashboard.tsx
"use client";
import React, { useMemo } from "react";
import { useAccount, useReadContract, useBalance } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useStaking } from "@/hooks/useStaking";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { parseUnits, formatUnits } from "viem";
import toast from "react-hot-toast";
import { isValidNumberInput } from "@/lib/utils";

interface StakingDashboardProps {
  totalPositionCount: number | null;
  selectedTierId: number;
}

export function StakingDashboard({ totalPositionCount, selectedTierId }: StakingDashboardProps) {
  const { address, chainId } = useAccount();

  const contractAddress = chainId
    ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.TokenStaking
    : undefined;

  const tokenAddress = chainId
    ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.pREWAToken
    : undefined;

  const [stakeAmount, setStakeAmount] = React.useState("");

  const isAmountValid = useMemo(
    () => isValidNumberInput(stakeAmount),
    [stakeAmount]
  );

  const { data: pREWABalance } = useBalance({
    address,
    token: tokenAddress,
    query: { enabled: !!address && !!tokenAddress, refetchInterval: 5000 },
  });

  const handlePercentClick = (percent: number) => {
    if (!pREWABalance) return;
    const newAmount = (pREWABalance.value * BigInt(percent)) / 100n;
    setStakeAmount(formatUnits(newAmount, pREWABalance.decimals));
  };

  const { data: maxPositionsData } = useReadContract({
    address: contractAddress,
    abi: pREWAAbis.TokenStaking,
    functionName: "getMaxPositionsPerUser",
    query: { enabled: !!contractAddress },
  });
  const maxPositions = maxPositionsData ? Number(maxPositionsData) : 0;

  const isAtPositionLimit =
    totalPositionCount !== null &&
    maxPositions > 0 &&
    totalPositionCount >= maxPositions;

  const hasSufficientBalance = useMemo(() => {
    if (!isAmountValid || !pREWABalance) return false;
    return parseUnits(stakeAmount, pREWABalance.decimals) <= pREWABalance.value;
  }, [stakeAmount, pREWABalance, isAmountValid]);

  const { allowance, approve, isLoading: isApprovalLoading } =
    useTokenApproval(tokenAddress, contractAddress);
  const { stake, isLoading: isStakingLoading } = useStaking();

  const needsApproval = useMemo(() => {
    if (!isAmountValid || !hasSufficientBalance || !pREWABalance) return false;
    return !allowance || allowance < parseUnits(stakeAmount, pREWABalance.decimals);
  }, [isAmountValid, hasSufficientBalance, pREWABalance, allowance, stakeAmount]);
  
  const handleStake = () => {
    if (!isAmountValid) return toast.error("Please enter a valid amount.");
    if (!hasSufficientBalance) return toast.error("Insufficient pREWA balance.");
    
    const stakeAction = () => stake(stakeAmount, selectedTierId);
    
    if (needsApproval) {
      approve({ onSuccess: stakeAction });
    } else {
      stakeAction();
    }
  };

  const isLoading = isApprovalLoading || isStakingLoading;
  
  const getButtonText = () => {
    if (isAtPositionLimit) return `Position Limit Reached (${maxPositions})`;
    if (!isAmountValid) return "Enter an amount";
    if (!hasSufficientBalance) return "Insufficient Balance";
    if (needsApproval) return "Approve pREWA";
    return "Stake";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stake Your pREWA</CardTitle>
        {isAtPositionLimit && (
          <CardDescription className="text-destructive">
            You have reached your maximum of {maxPositions} total staking positions.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="p-3 border rounded-md bg-greyscale-25 dark:bg-dark-surface space-y-2">
          <div className="flex justify-between items-baseline mb-1">
            <label htmlFor="amount" className="text-sm font-medium">
              Amount to Stake (Tier {selectedTierId})
            </label>
            {pREWABalance && (
              <span className="text-xs text-gray-500">
                Balance: {formatUnits(pREWABalance.value, pREWABalance.decimals)}
              </span>
            )}
          </div>
          <Input
            id="amount"
            type="text"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="0.0 pREWA"
            disabled={isAtPositionLimit || isLoading}
            className="web3-input !border-0 !px-0 !h-auto !text-2xl"
          />
          <div className="flex justify-end gap-2">
            {[25, 50, 75, 100].map(p => (
                <Button key={p} size="sm" variant="secondary" onClick={() => handlePercentClick(p)} disabled={!pREWABalance || pREWABalance.value === 0n}>
                    {p === 100 ? 'MAX' : `${p}%`}
                </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Button
            onClick={handleStake}
            disabled={isLoading || isAtPositionLimit || !isAmountValid || !hasSufficientBalance}
            className="w-full"
          >
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            {getButtonText()}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}