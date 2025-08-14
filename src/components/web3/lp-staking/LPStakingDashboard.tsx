// src/components/web3/lp-staking/LPStakingDashboard.tsx
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { pREWAAddresses } from '@/constants';
import { useTokenApproval } from '@/hooks/useTokenApproval';
import { useLPStaking } from '@/hooks/useLPStaking';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { parseUnits, formatUnits, Address } from 'viem';
import { LP_TOKEN_LISTS } from '@/constants/tokens'; // FIX: Import the new LP token list
import { isValidNumberInput } from '@/lib/utils';

interface LPStakingDashboardProps {
  selectedTierId: number;
}

export function LPStakingDashboard({ selectedTierId }: LPStakingDashboardProps) {
  const { address, chainId } = useAccount();

  // FIX: Use the canonical list of stakeable LP pools from constants
  const stakeablePools = useMemo(() => LP_TOKEN_LISTS[chainId as keyof typeof LP_TOKEN_LISTS] || [], [chainId]);
  
  const [selectedLp, setSelectedLp] = useState<Address | undefined>(stakeablePools[0]?.address);
  const [amount, setAmount] = useState('');
  const isAmountValid = useMemo(() => isValidNumberInput(amount), [amount]);

  useEffect(() => {
    // Set the first available pool as default when chain changes
    if (stakeablePools.length > 0) {
      setSelectedLp(stakeablePools[0].address);
    }
  }, [stakeablePools]);

  const lpStakingContractAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LPStaking : undefined;
  
  const { allowance, approve, isLoading: isApproving } = useTokenApproval(selectedLp, lpStakingContractAddress);
  const { stakeLPTokens, isLoading: isStaking } = useLPStaking();

  const { data: lpBalance } = useBalance({
    address: address,
    token: selectedLp,
    query: { enabled: !!selectedLp, refetchInterval: 5000 }
  });

  const hasSufficientBalance = useMemo(() => {
    if (!isAmountValid || !lpBalance) return false;
    return parseUnits(amount, lpBalance.decimals) <= lpBalance.value;
  }, [amount, lpBalance, isAmountValid]);

  const needsApproval = isAmountValid && selectedLp && hasSufficientBalance && (!allowance || allowance < parseUnits(amount, 18));
  const isLoading = isApproving || isStaking;

  const handleStake = () => {
    if (!selectedLp || !isAmountValid || !hasSufficientBalance) return;
    const stakeAction = () => stakeLPTokens(selectedLp, amount, selectedTierId);

    if (needsApproval) {
      approve({ onSuccess: stakeAction });
    } else {
      stakeAction();
    }
  };

  if (stakeablePools.length === 0) {
    return (
      <Card>
          <CardHeader>
              <CardTitle>Stake LP Tokens</CardTitle>
          </CardHeader>
          <CardContent>
              <p className="text-center text-gray-500">
                  There are currently no active LP staking pools on this network.
              </p>
          </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stake LP Tokens</CardTitle>
        <CardDescription>Select a pool and amount to stake in Tier {selectedTierId}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Pool to Stake</label>
            <select
                value={selectedLp}
                onChange={(e) => {
                    setSelectedLp(e.target.value as Address);
                    setAmount('');
                }}
                className="w-full p-2 border rounded-md bg-transparent dark:bg-dark-surface dark:border-dark-border"
            >
                {stakeablePools.map(lp => (
                    <option key={lp.address} value={lp.address}>{lp.name}</option>
                ))}
            </select>
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-1">
                <label className="text-sm font-medium">Amount to Stake</label>
                {lpBalance && <span className="text-xs text-gray-500">Balance: {formatUnits(lpBalance.value, lpBalance.decimals)}</span>}
            </div>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" />
          </div>
          <Button onClick={handleStake} disabled={isLoading || !isAmountValid || !selectedLp || !hasSufficientBalance} className="w-full">
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            {!isAmountValid ? "Enter an amount" : !hasSufficientBalance ? "Insufficient LP Balance" : needsApproval ? "Approve LP Token" : "Stake LP Tokens"}
          </Button>
      </CardContent>
    </Card>
  );
}