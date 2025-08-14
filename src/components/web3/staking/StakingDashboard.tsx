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

  const typedChainId = chainId === 56 ? 56 : chainId === 97 ? 97 : undefined;

  const { data: nativeBalance } = useBalance({
    address,
    chainId: typedChainId,
  });

  const lowBalanceThreshold = parseUnits("0.005", 18);
  const hasLowNativeBalance = nativeBalance
    ? nativeBalance.value < lowBalanceThreshold
    : false;

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

  // FIX: Add balance check to prevent actions when balance is insufficient
  const hasSufficientBalance = useMemo(() => {
    if (!isAmountValid || !pREWABalance) return false;
    return parseUnits(stakeAmount, pREWABalance.decimals) <= pREWABalance.value;
  }, [stakeAmount, pREWABalance, isAmountValid]);

  const { allowance, approve, isLoading: isApprovalLoading } =
    useTokenApproval(tokenAddress, contractAddress);
  const { stake, isLoading: isStakingLoading } = useStaking();

  const needsApproval =
    isAmountValid &&
    hasSufficientBalance && // <-- Add balance check
    pREWABalance &&
    (!allowance || allowance < parseUnits(stakeAmount || "0", pREWABalance.decimals));
  
  const canStake = isAmountValid && hasSufficientBalance && !needsApproval;

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
      <CardContent className="space-y-4">
        <div>
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
          />
        </div>

        <div className="space-y-2">
          {/* FIX: Update the disabled logic to check for balance */}
          <Button
            onClick={handleStake}
            disabled={isLoading || isAtPositionLimit || !isAmountValid || !hasSufficientBalance}
            className="w-full"
          >
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            {!isAmountValid ? "Enter an amount" : !hasSufficientBalance ? "Insufficient Balance" : needsApproval ? "Approve pREWA" : "Stake"}
          </Button>

          {hasLowNativeBalance && needsApproval && !isLoading && (
            <p className="text-center text-xs text-amber-600 dark:text-amber-500 p-2 rounded-md bg-amber-50 dark:bg-amber-950">
              Your BNB balance is low. You may need more for transaction fees.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}