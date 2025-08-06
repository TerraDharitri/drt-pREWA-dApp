"use client";
import React from 'react';
import { Token } from '@/constants/tokens';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { formatUnits } from 'viem';

interface LiquidityInputProps {
  token: Token;
  amount: string;
  balance?: { value: bigint; decimals: number };
  onAmountChange: (value: string) => void;
  onSelectToken: () => void;
}

export function LiquidityInput({ token, amount, balance, onAmountChange, onSelectToken }: LiquidityInputProps) {
  const handlePercentClick = (percent: number) => {
    if (!balance) return;
    const newAmount = (balance.value * BigInt(percent)) / 100n;
    onAmountChange(formatUnits(newAmount, balance.decimals));
  };
  
  return (
    <div className="p-4 rounded-lg bg-greyscale-50 dark:bg-dark-surface space-y-2">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={onSelectToken} className="h-auto p-1 rounded-full">
          <Image src={token.logoURI} alt={token.symbol} width={24} height={24} className="rounded-full mr-2" />
          <span className="font-bold">{token.symbol}</span>
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
        <div className="text-sm text-greyscale-400">
          Balance: {balance ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(5) : '0.0'}
        </div>
      </div>
      <Input
        type="text"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        placeholder="0.0"
        className="web3-input !text-2xl !h-auto !p-0 !border-0 focus:!ring-0"
      />
      <div className="flex justify-end gap-2">
        {[25, 50, 75, 100].map(p => (
            <Button key={p} size="sm" variant="secondary" onClick={() => handlePercentClick(p)}>{p === 100 ? 'MAX' : `${p}%`}</Button>
        ))}
      </div>
    </div>
  );
}