// src/components/web3/liquidity/AddLiquidityForm.tsx
"use client";

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useLiquidityState } from '@/hooks/useLiquidityState';
import { useTokenApproval } from '@/hooks/useTokenApproval';
import { useLiquidity } from '@/hooks/useLiquidity';
import { TokenSelectorModal } from '../swap/TokenSelectorModal';
import { LiquidityInput } from './LiquidityInput';
import { pREWAAddresses } from '@/constants';
import { useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Spinner } from '@/components/ui/Spinner';
import { isValidNumberInput } from '@/lib/utils';

export function AddLiquidityForm() {
    const { chainId } = useAccount();
    const { 
        TOKENS, tokenA, tokenB, amountA, amountB, balanceA, balanceB,
        handleSelectToken, handleAmountAChange, handleAmountBChange,
        isModalOpen, openModal, closeModal, modalType, reserves
    } = useLiquidityState();

    const liquidityManagerAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LiquidityManager : undefined;

    const { allowance: allowanceA, approve: approveA, isLoading: isApprovingA } = useTokenApproval(tokenA?.address, liquidityManagerAddress);
    const { allowance: allowanceB, approve: approveB, isLoading: isApprovingB } = useTokenApproval(tokenB?.address, liquidityManagerAddress);

    const { addLiquidity, addLiquidityBNB, isLoading: isAddingLiquidity } = useLiquidity();

    const isAmountAValid = useMemo(() => isValidNumberInput(amountA), [amountA]);
    const isAmountBValid = useMemo(() => isValidNumberInput(amountB), [amountB]);

    const hasSufficientBalanceA = useMemo(() => {
        if (!isAmountAValid || !balanceA) return false;
        return parseUnits(amountA, balanceA.decimals) <= balanceA.value;
    }, [amountA, balanceA, isAmountAValid]);

    const hasSufficientBalanceB = useMemo(() => {
        if (!isAmountBValid || !balanceB) return false;
        return parseUnits(amountB, balanceB.decimals) <= balanceB.value;
    }, [amountB, balanceB, isAmountBValid]);

    const needsApprovalA = useMemo(() => tokenA && isAmountAValid && hasSufficientBalanceA && tokenA.symbol !== 'BNB' && (!allowanceA || allowanceA < parseUnits(amountA, tokenA.decimals)), [isAmountAValid, hasSufficientBalanceA, tokenA, allowanceA, amountA]);
    const needsApprovalB = useMemo(() => tokenB && isAmountBValid && hasSufficientBalanceB && tokenB.symbol !== 'BNB' && (!allowanceB || allowanceB < parseUnits(amountB, tokenB.decimals)), [isAmountBValid, hasSufficientBalanceB, tokenB, allowanceB, amountB]);
    
    const isLoading = isApprovingA || isApprovingB || isAddingLiquidity;
    
    const handleAddLiquidity = () => {
        if (!tokenA || !tokenB) return;
        if (needsApprovalA) {
            approveA({ onSuccess: handleAddLiquidity });
            return;
        }
        if (needsApprovalB) {
            approveB({ onSuccess: handleAddLiquidity });
            return;
        }

        const isTokenABNB = tokenA.symbol === 'BNB';
        const isTokenBBNB = tokenB.symbol === 'BNB';
        
        // FIX: Corrected function calls with the right number of arguments
        if (isTokenABNB) {
            addLiquidityBNB(tokenB.address, amountB);
        } else if (isTokenBBNB) {
            addLiquidityBNB(tokenA.address, amountA);
        } else {
            addLiquidity(tokenA.address, tokenB.address, amountA);
        }
    };
    
    const getButtonText = () => {
        if (!tokenA || !tokenB) return "Select Tokens";
        if (!isAmountAValid || !isAmountBValid) return "Enter amounts";
        if (!hasSufficientBalanceA) return `Insufficient ${tokenA.symbol} Balance`;
        if (!hasSufficientBalanceB) return `Insufficient ${tokenB.symbol} Balance`;
        if (needsApprovalA) return `Approve ${tokenA.symbol}`;
        if (needsApprovalB) return `Approve ${tokenB.symbol}`;
        return "Add Liquidity";
    };

    if (!tokenA || !tokenB) {
        return (
            <Card className="max-w-md mx-auto">
                <CardHeader><CardTitle>Add V2 Liquidity</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center p-8"><Spinner /></CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Add V2 Liquidity</CardTitle>
                    <CardDescription>Provide liquidity to earn fees.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <LiquidityInput 
                        token={tokenA}
                        amount={amountA}
                        balance={balanceA}
                        onAmountChange={handleAmountAChange}
                        onTokenSelect={() => openModal('A')}
                    />

                    <div className="flex justify-center text-2xl font-bold text-gray-400">+</div>

                    <LiquidityInput 
                        token={tokenB}
                        amount={amountB}
                        balance={balanceB}
                        onAmountChange={handleAmountBChange}
                        onTokenSelect={() => openModal('B')}
                    />

                    {reserves.reserveA > 0n && (
                        <div className="text-xs text-center text-gray-500 pt-2">
                            <p className="font-semibold">Current Pool Rates</p>
                            <p>1 {tokenA.symbol} = {formatUnits(reserves.reserveB * BigInt(10**tokenA.decimals) / reserves.reserveA, tokenB.decimals)} {tokenB.symbol}</p>
                            <p>1 {tokenB.symbol} = {formatUnits(reserves.reserveA * BigInt(10**tokenB.decimals) / reserves.reserveB, tokenA.decimals)} {tokenA.symbol}</p>
                        </div>
                    )}

                    <Button onClick={handleAddLiquidity} className="w-full" disabled={isLoading || !isAmountAValid || !isAmountBValid || !hasSufficientBalanceA || !hasSufficientBalanceB}>
                        {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                        {getButtonText()}
                    </Button>
                </CardContent>
            </Card>

            {tokenA && tokenB && (
                <TokenSelectorModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    onSelect={handleSelectToken}
                    tokenList={TOKENS}
                    exclude={modalType === 'A' ? [tokenB] : [tokenA]}
                />
            )}
        </>
    );
}