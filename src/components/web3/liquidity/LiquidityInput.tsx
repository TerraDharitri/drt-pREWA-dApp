// src/components/web3/liquidity/LiquidityInput.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import type { Token } from '@/constants/tokens';
import { formatUnits } from 'viem';

interface LiquidityInputProps {
    token: Token;
    amount: string;
    balance: { decimals: number; formatted: string; symbol: string; value: bigint; } | undefined;
    onAmountChange: (value: string) => void;
    onTokenSelect: () => void; // FIX: Add the missing prop
}

const TokenButton = ({ token, onClick }: { token: Token, onClick: () => void }) => (
    <Button variant="ghost" className="h-auto px-2 py-1 flex items-center" onClick={onClick}>
        <Image src={token.logoURI} alt={token.symbol} width={24} height={24} className="rounded-full mr-2" />
        <span className="font-semibold">{token.symbol}</span>
        <ChevronDown className="ml-1 h-4 w-4" />
    </Button>
);

export function LiquidityInput({ token, amount, balance, onAmountChange, onTokenSelect }: LiquidityInputProps) {
    
    const handlePercentClick = (percent: number) => {
        if (!balance) return;
        const newAmount = (balance.value * BigInt(percent)) / 100n;
        onAmountChange(formatUnits(newAmount, balance.decimals));
    };

    return (
        <div className="p-4 rounded-lg bg-greyscale-50 dark:bg-dark-surface space-y-2 border">
            <div className="flex justify-between items-center">
                {token && <TokenButton token={token} onClick={onTokenSelect} />}
                {balance && <span className="text-xs text-muted-foreground">Balance: {parseFloat(balance.formatted).toFixed(5)}</span>}
            </div>
            <Input
                type="text"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                placeholder="0.0"
                className="web3-input !text-2xl !h-auto !p-0 !border-0 focus:!ring-0 bg-transparent"
            />
            <div className="flex justify-end gap-2">
                {[25, 50, 75, 100].map(p => (
                    <Button key={p} size="sm" variant="secondary" onClick={() => handlePercentClick(p)} disabled={!balance || balance.value === 0n}>
                        {p === 100 ? 'MAX' : `${p}%`}
                    </Button>
                ))}
            </div>
        </div>
    );
}