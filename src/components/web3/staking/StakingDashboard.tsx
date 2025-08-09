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
}

export function StakingDashboard({ totalPositionCount }: StakingDashboardProps) {
  const { address, chainId } = useAccount();

  const contractAddress = chainId
    ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.TokenStaking
    : undefined;

  const tokenAddress = chainId
    ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.pREWAToken
    : undefined;

  const [stakeAmount, setStakeAmount] = React.useState("");
  const [selectedTier, setSelectedTier] = React.useState(0);

  const isAmountValid = useMemo(
    () => isValidNumberInput(stakeAmount),
    [stakeAmount]
  );

  // pREWA ERC-20 balance (wagmi narrows chain automatically via token address)
  const { data: pREWABalance } = useBalance({
    address,
    token: tokenAddress,
    query: { enabled: !!address && !!tokenAddress, refetchInterval: 5000 },
  });

  // ✅ Narrow chainId to the union wagmi expects (56 | 97 | undefined)
  const typedChainId = chainId === 56 ? 56 : chainId === 97 ? 97 : undefined;

  // Native balance (BNB)
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

  const { allowance, approve, isLoading: isApprovalLoading } =
    useTokenApproval(tokenAddress, contractAddress);
  const { stake, isLoading: isStakingLoading } = useStaking();

  const needsApproval =
    isAmountValid &&
    (!allowance || allowance < parseUnits(stakeAmount || "0", 18));

  const handleStake = () => {
    if (!isAmountValid) return toast.error("Please enter a valid amount to stake.");
    if (needsApproval) {
      approve({ onSuccess: () => stake(stakeAmount, selectedTier) });
    } else {
      stake(stakeAmount, selectedTier);
    }
  };

  const isLoading = isApprovalLoading || isStakingLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stake Your pREWA</CardTitle>
        {isAtPositionLimit && (
          <CardDescription className="text-error-100">
            You have reached your maximum of {maxPositions} total staking positions.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="tier" className="mb-1 block text-sm font-medium">
            Staking Tier
          </label>
          <Input
            id="tier"
            type="number"
            value={selectedTier}
            onChange={(e) => setSelectedTier(parseInt(e.target.value))}
            placeholder="Enter Tier ID (e.g., 0)"
            disabled={isAtPositionLimit || isLoading}
          />
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-1">
            <label htmlFor="amount" className="text-sm font-medium">
              Amount to Stake
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
          <Button
            onClick={handleStake}
            disabled={isLoading || !isAmountValid || isAtPositionLimit}
            className="w-full"
          >
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            {needsApproval ? "Approve pREWA" : "Stake"}
          </Button>

          {hasLowNativeBalance && needsApproval && !isLoading && (
            <p className="text-center text-xs text-warning-200 dark:text-warning-100 p-2 rounded-md bg-warning-0 dark:bg-warning-300/20">
              Your BNB balance is low. You may need to confirm the transaction
              despite a potential gas warning from your wallet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
