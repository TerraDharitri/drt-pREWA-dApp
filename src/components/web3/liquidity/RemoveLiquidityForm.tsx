"use client";
import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { pREWAAddresses, pREWAAbis } from '@/constants';
import { useTokenApproval } from '@/hooks/useTokenApproval';
import { useLiquidity } from '@/hooks/useLiquidity'; 
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { parseUnits, formatUnits, Address } from 'viem';

const BUSD_TESTNET_ADDRESS: Address = '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee'; 

export function RemoveLiquidityForm() {
  const { address, chainId } = useAccount();
  const liquidityManagerAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LiquidityManager : undefined;

  const [lpTokenAddress, setLpTokenAddress] = useState<Address | undefined>();
  const [lpAmount, setLpAmount] = useState("");
  
  const { data: pREWA_BNB_LP_Address } = useReadContract({
      address: liquidityManagerAddress, abi: pREWAAbis.LiquidityManager, functionName: 'getLPTokenAddress', args: ['0x0000000000000000000000000000000000000000']
  });

  const { data: pREWA_BUSD_LP_Address } = useReadContract({
      address: liquidityManagerAddress, abi: pREWAAbis.LiquidityManager, functionName: 'getLPTokenAddress', args: [BUSD_TESTNET_ADDRESS]
  });
  
  const [pairType, setPairType] = useState<'TOKEN' | 'BNB'>('TOKEN');

  useEffect(() => {
    const newLpAddress = pairType === 'TOKEN' ? pREWA_BUSD_LP_Address : pREWA_BNB_LP_Address;
    // CORRECTED: Explicitly cast the 'unknown' type to 'Address | undefined' before setting state.
    setLpTokenAddress(newLpAddress as Address | undefined);
  }, [pairType, pREWA_BUSD_LP_Address, pREWA_BNB_LP_Address]);
  
  const { data: lpBalance } = useBalance({ address, token: lpTokenAddress, query: { enabled: !!lpTokenAddress }});
  
  const { allowance, approve, isLoading: isApproving } = useTokenApproval(lpTokenAddress, liquidityManagerAddress);
  const { removeLiquidity, removeLiquidityBNB, isLoading: isRemoving } = useLiquidity();
  
  const needsApproval = lpAmount && lpTokenAddress ? !allowance || allowance < parseUnits(lpAmount, 18) : false;
  const isLoading = isApproving || isRemoving;

  const handleRemove = () => {
    if (needsApproval) {
      approve();
    } else {
        if (pairType === 'TOKEN') {
            removeLiquidity(BUSD_TESTNET_ADDRESS, lpAmount);
        } else {
            removeLiquidityBNB(lpAmount);
        }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => setPairType('TOKEN')} variant={pairType === 'TOKEN' ? 'default' : 'secondary'}>pREWA-BUSD</Button>
        <Button onClick={() => setPairType('BNB')} variant={pairType === 'BNB' ? 'default' : 'secondary'}>pREWA-BNB</Button>
      </div>
      <div>
        <div className="flex justify-between items-baseline mb-1">
          <label>LP Token Amount to Remove</label>
          {lpBalance && <span className="text-xs text-gray-500">Balance: {formatUnits(lpBalance.value, lpBalance.decimals)}</span>}
        </div>
        <Input type="text" value={lpAmount} onChange={e => setLpAmount(e.target.value)} placeholder="0.0" />
      </div>
      <Button onClick={handleRemove} className="w-full" disabled={isLoading || !lpAmount}>
        {isLoading && <Spinner className="mr-2 h-4 w-4" />}
        {needsApproval ? 'Approve LP Token' : 'Remove Liquidity'}
      </Button>
    </div>
  );
}