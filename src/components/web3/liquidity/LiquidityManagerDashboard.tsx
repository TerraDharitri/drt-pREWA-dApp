// src/components/web3/liquidity/LiquidityManagerDashboard.tsx

"use client";
import React, { useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useLiquidity } from "@/hooks/useLiquidity";
import { useLiquidityState } from "@/hooks/useLiquidityState";
import { LiquidityInput } from "./LiquidityInput";
import { TokenSelectorModal } from "../swap/TokenSelectorModal";
import { LiquiditySuccessModal } from './LiquiditySuccessModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { parseUnits, formatUnits, Address } from "viem";
import toast from 'react-hot-toast';

export function LiquidityManagerDashboard() {
  const { chainId } = useAccount();
  const publicClient = usePublicClient();
  const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);
  const [liquidityData, setLiquidityData] = useState({ lpAmount: 0n, lpTokenAddress: '0x' as Address, lpTokenSymbol: '' });

  const {
    TOKENS, tokenA, tokenB, amountA, amountB, balanceA, balanceB, otherTokenForPair, reserves,
    handleSelectToken, handleAmountAChange, handleAmountBChange,
    isModalOpen, openModal, closeModal, modalType, 
    isInitialPairInfoLoading
  } = useLiquidityState();

  const liquidityManagerAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LiquidityManager : undefined;

  const handleSuccess = async ({ lpReceived, otherToken }: { lpReceived: bigint, otherToken: Address }) => {
    if (!liquidityManagerAddress || !publicClient) return;
    
    try {
        const lpTokenAddress = await publicClient.readContract({
            address: liquidityManagerAddress,
            abi: pREWAAbis.ILiquidityManager,
            functionName: 'getLPTokenAddress',
            args: [otherToken]
        }) as Address;

        // --- FIX: Use a complete ERC20 ABI (like IpREWAToken) to read the symbol ---
        const lpTokenSymbol = await publicClient.readContract({
            address: lpTokenAddress,
            abi: pREWAAbis.IpREWAToken, // Changed from IPancakePair
            functionName: 'symbol',
        }) as string;

        setLiquidityData({ lpAmount: lpReceived, lpTokenAddress, lpTokenSymbol });
        setSuccessModalOpen(true);
    } catch (error) {
        console.error("Error fetching LP token details for success modal:", error);
        toast.error("Could not retrieve LP Token details, but liquidity was added.");
    }
  };
  
  const { addLiquidity, addLiquidityBNB, isLoading: isAddingLiquidity } = useLiquidity({ onSuccess: handleSuccess });

  const tokenAForApproval = tokenA.symbol !== 'BNB' ? tokenA.address : undefined;
  const tokenBForApproval = tokenB.symbol !== 'BNB' ? tokenB.address : undefined;

  const { allowance: allowanceA, approve: approveA, isLoading: isApprovingA } = useTokenApproval(tokenAForApproval, liquidityManagerAddress);
  const { allowance: allowanceB, approve: approveB, isLoading: isApprovingB } = useTokenApproval(tokenBForApproval, liquidityManagerAddress);
  
  const needsApprovalA = tokenAForApproval && amountA && parseFloat(amountA) > 0 && (!allowanceA || allowanceA < parseUnits(amountA, tokenA.decimals));
  const needsApprovalB = tokenBForApproval && amountB && parseFloat(amountB) > 0 && (!allowanceB || allowanceB < parseUnits(amountB, tokenB.decimals));

  const isLoading = isApprovingA || isApprovingB || isAddingLiquidity;
  const isInvalidPair = !otherTokenForPair;

  const handleSupply = () => {
    const executeSupply = () => {
        const pREWAAddress = pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.pREWAToken;
        const pREWAAmount = tokenA.address === pREWAAddress ? amountA : amountB;
        const otherToken = tokenA.address === pREWAAddress ? tokenB : tokenA;
        const otherAmount = tokenA.address === pREWAAddress ? amountB : amountA;

        if (otherToken.symbol === 'BNB') {
            addLiquidityBNB(pREWAAmount, otherAmount);
        } else {
            addLiquidity(otherToken.address, pREWAAmount, otherAmount);
        }
    };

    if (needsApprovalA) {
        approveA({ onSuccess: needsApprovalB ? () => approveB({ onSuccess: executeSupply }) : executeSupply });
    } else if (needsApprovalB) {
        approveB({ onSuccess: executeSupply });
    } else {
        executeSupply();
    }
  };

  const getButtonText = () => {
    if (isInvalidPair) return "Invalid Pair (Select pREWA)";
    if (!amountA || !amountB || Number(amountA) <= 0 || Number(amountB) <= 0) return "Enter an amount";
    if (needsApprovalA) return `Approve ${tokenA.symbol}`;
    if (needsApprovalB) return `Approve ${tokenB.symbol}`;
    return "Confirm Supply";
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
            token={tokenA} amount={amountA} balance={balanceA}
            onAmountChange={handleAmountAChange} onSelectToken={() => openModal('A')}
          />
          <div className="flex justify-center text-2xl font-bold">+</div>
           <LiquidityInput 
            token={tokenB} amount={amountB} balance={balanceB}
            onAmountChange={handleAmountBChange} onSelectToken={() => openModal('B')}
          />

          {isInitialPairInfoLoading ? (
             <div className="text-center text-sm text-greyscale-400 p-3"><Spinner /></div>
          ) : reserves && reserves.reserveA > 0n && reserves.reserveB > 0n ? (
            <Card className="bg-greyscale-25 dark:bg-dark-surface !mt-6">
                <CardContent className="text-sm p-3 space-y-2">
                    <h4 className="font-semibold">Current Pool Rates</h4>
                    <div className="flex justify-between"><span>1 {tokenA.symbol} = {formatUnits(reserves.reserveB * (10n ** 18n) / reserves.reserveA, 18)} {tokenB.symbol}</span></div>
                    <div className="flex justify-between"><span>1 {tokenB.symbol} = {formatUnits(reserves.reserveA * (10n ** 18n) / reserves.reserveB, 18)} {tokenA.symbol}</span></div>
                </CardContent>
            </Card>
          ) : (
            !isInvalidPair && (
                <div className="text-center text-sm text-greyscale-400 p-3 bg-greyscale-25 dark:bg-dark-surface rounded-md !mt-6">
                    You are the first liquidity provider. The ratio of tokens you add will set the initial price.
                </div>
            )
          )}
          
          <div className="pt-2">
            <Button 
              onClick={handleSupply} 
              disabled={isLoading || isInvalidPair || (!amountA || !amountB)}
              className="w-full"
            >
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {getButtonText()}
            </Button>
          </div>
        </CardContent>
      </Card>

      <TokenSelectorModal 
        isOpen={isModalOpen} onClose={closeModal} onSelect={handleSelectToken}
        tokenList={TOKENS} exclude={modalType === 'A' ? [tokenB] : [tokenA]}
      />
      
      <LiquiditySuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        lpAmount={liquidityData.lpAmount}
        lpTokenAddress={liquidityData.lpTokenAddress}
        lpTokenSymbol={liquidityData.lpTokenSymbol}
      />
    </>
  );
}