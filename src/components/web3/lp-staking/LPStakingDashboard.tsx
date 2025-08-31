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
import { parseUnits, formatUnits, Address, isAddressEqual } from 'viem';
import { LP_TOKEN_LISTS, TOKEN_LISTS } from '@/constants/tokens';
import { isValidNumberInput } from '@/lib/utils';
import { formatAddress } from '@/lib/web3-utils';

interface LPStakingDashboardProps {
  selectedTierId: number;
}

export function LPStakingDashboard({ selectedTierId }: LPStakingDashboardProps) {
  const { address, chainId } = useAccount();

  const stakeablePools = useMemo(() => LP_TOKEN_LISTS[chainId as keyof typeof LP_TOKEN_LISTS] || [], [chainId]);
  
  const [selectedLp, setSelectedLp] = useState<Address | undefined>(stakeablePools[0]?.address);
  const [amount, setAmount] = useState('');
  const isAmountValid = useMemo(() => isValidNumberInput(amount), [amount]);

  useEffect(() => {
    if (stakeablePools.length > 0 && !selectedLp) {
      setSelectedLp(stakeablePools[0].address);
    }
  }, [stakeablePools, selectedLp]);

  const lpStakingContractAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LPStaking : undefined;
  
  const { allowance, approve, isLoading: isApproving } = useTokenApproval(selectedLp, lpStakingContractAddress);
  const { stakeLPTokens, isLoading: isStaking } = useLPStaking();

  const { data: lpBalance } = useBalance({
    address: address,
    token: selectedLp,
    query: { enabled: !!selectedLp, refetchInterval: 5000 }
  });

  const handlePercentClick = (percent: number) => {
    if (!lpBalance) return;
    const newAmount = (lpBalance.value * BigInt(percent)) / 100n;
    setAmount(formatUnits(newAmount, lpBalance.decimals));
  };

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
  
  const getPoolName = (lpAddress: Address) => {
      const tokens = chainId ? TOKEN_LISTS[chainId as keyof typeof TOKEN_LISTS] : [];
      const lpInfo = stakeablePools.find(p => isAddressEqual(p.address, lpAddress));
      return lpInfo ? lpInfo.name : `LP Token ${formatAddress(lpAddress)}`;
  }

  // FIX: Logic for the main button's text and disabled state
  const getButtonText = () => {
    if (stakeablePools.length === 0) return "No Pools Available";
    if (!isAmountValid) return "Enter an amount";
    if (!hasSufficientBalance) return "Insufficient LP Balance";
    if (needsApproval) return "Approve LP Token";
    return "Stake LP Tokens";
  };
  const isButtonDisabled = isLoading || !isAmountValid || !selectedLp || !hasSufficientBalance;


  return (
    // FIX: Removed the outer Card to prevent double-wrapping and layout issues.
    <div className="space-y-4">
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
                    disabled={stakeablePools.length === 0}
                    className="w-full p-2 border rounded-md bg-transparent dark:bg-dark-surface dark:border-dark-border"
                >
                    {stakeablePools.length === 0 && <option>No pools available</option>}
                    {stakeablePools.map(lp => (
                        <option key={lp.address} value={lp.address}>{lp.name}</option>
                    ))}
                </select>
              </div>
              <div className="p-3 border rounded-md bg-greyscale-25 dark:bg-dark-surface space-y-2">
                <div className="flex justify-between items-baseline mb-1">
                    <label className="text-sm font-medium">Amount to Stake</label>
                    {lpBalance && <span className="text-xs text-gray-500">Balance: {formatUnits(lpBalance.value, lpBalance.decimals)}</span>}
                </div>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" disabled={!selectedLp}/>
                 {/* FIX: Add the percentage buttons back */}
                <div className="flex justify-end gap-2">
                  {[25, 50, 75, 100].map(p => (
                      <Button key={p} size="sm" variant="secondary" onClick={() => handlePercentClick(p)} disabled={!lpBalance || lpBalance.value === 0n}>
                          {p === 100 ? 'MAX' : `${p}%`}
                      </Button>
                  ))}
                </div>
              </div>
              <Button onClick={handleStake} disabled={isButtonDisabled} className="w-full">
                {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                {getButtonText()}
              </Button>
            </CardContent>
        </Card>
    </div>
  );
}