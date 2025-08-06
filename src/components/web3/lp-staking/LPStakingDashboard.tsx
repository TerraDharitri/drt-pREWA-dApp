// src/components/web3/lp-staking/LPStakingDashboard.tsx

"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { pREWAAddresses } from '@/constants';
import { useTokenApproval } from '@/hooks/useTokenApproval';
import { useLPStaking } from '@/hooks/useLPStaking';
import { useReadLiquidityPositions } from '@/hooks/useReadLiquidityPositions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { parseUnits, formatUnits, Address, isAddressEqual } from 'viem';
import { TOKEN_LIST_TESTNET } from '@/constants/tokens';
import { formatAddress } from '@/lib/web3-utils';
import { isValidNumberInput } from '@/lib/utils';

export function LPStakingDashboard() {
  const { address, chainId } = useAccount();
  const { positions: availableLPs, isLoading: isLoadingLPs } = useReadLiquidityPositions();
  
  const [selectedLp, setSelectedLp] = useState<Address | undefined>();
  const [amount, setAmount] = useState('');
  const [tierId, setTierId] = useState(0);

  const isAmountValid = useMemo(() => isValidNumberInput(amount), [amount]);

  useEffect(() => {
      if (availableLPs.length > 0 && !selectedLp) {
          setSelectedLp(availableLPs[0].lpTokenAddress);
      }
  }, [availableLPs, selectedLp]);

  const lpStakingContractAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LPStaking : undefined;
  
  const { allowance, approve, isLoading: isApproving } = useTokenApproval(selectedLp, lpStakingContractAddress);
  const { stakeLPTokens, isLoading: isStaking } = useLPStaking();

  const needsApproval = isAmountValid && selectedLp && (!allowance || allowance < parseUnits(amount, 18));
  const isLoading = isApproving || isStaking;

  const { data: lpBalance } = useBalance({
    address: address,
    token: selectedLp,
    query: { enabled: !!selectedLp, refetchInterval: 5000 }
  });

  const handleStake = () => {
    if (!selectedLp || !isAmountValid) return;
    if (needsApproval) {
      approve({ onSuccess: () => stakeLPTokens(selectedLp, amount, tierId) });
    } else {
      stakeLPTokens(selectedLp, amount, tierId);
    }
  };
  
  const getPoolName = (lp: {lpTokenAddress: Address, otherTokenAddress: Address}) => {
      const pREWA = TOKEN_LIST_TESTNET.find(t => t.symbol === 'pREWA');
      const otherTokenInfo = TOKEN_LIST_TESTNET.find(t => isAddressEqual(t.address, lp.otherTokenAddress));
      return otherTokenInfo ? `pREWA / ${otherTokenInfo.symbol}` : `pREWA / ${formatAddress(lp.otherTokenAddress)}`;
  }

  if (isLoadingLPs) {
    return <div className="flex justify-center p-8"><Spinner /></div>;
  }

  if (availableLPs.length === 0) {
      return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Stake LP Tokens</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-center text-gray-500">
                    You do not hold any pREWA LP tokens in your wallet. 
                    Please go to the "Pools" page first to provide liquidity.
                </p>
            </CardContent>
        </Card>
      );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Stake LP Tokens</CardTitle>
        <CardDescription>Stake your LP tokens to earn pREWA rewards.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Select Pool to Stake</label>
            <select
                value={selectedLp}
                onChange={(e) => {
                    setSelectedLp(e.target.value as Address);
                    setAmount('');
                }}
                className="w-full p-2 border rounded-md bg-transparent dark:bg-dark-surface dark:border-dark-border"
            >
                {availableLPs.map(lp => (
                    <option key={lp.id} value={lp.lpTokenAddress}>{getPoolName(lp)}</option>
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
          <div>
            <label className="mb-1 block text-sm font-medium">Staking Tier</label>
            <Input value={tierId} onChange={(e) => setTierId(Number(e.target.value))} type="number" placeholder="e.g., 0" />
          </div>
          <Button onClick={handleStake} disabled={isLoading || !isAmountValid || !selectedLp} className="w-full">
            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
            {needsApproval ? "Approve LP Token" : "Stake LP Tokens"}
          </Button>
      </CardContent>
    </Card>
  );
}