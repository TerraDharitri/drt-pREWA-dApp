"use client";
import React, { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits, Address } from "viem";
import { WalletIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";

import { useLiquidityState } from "@/hooks/useLiquidityState";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useLiquidity } from "@/hooks/useLiquidity";
import { useWatchAsset } from "@/hooks/useWatchAsset";
import { pREWAAddresses } from "@/constants";
import { isValidNumberInput } from "@/lib/utils";
import { TokenSelectorModal } from "../swap/TokenSelectorModal";
import { LiquiditySuccessModal } from './LiquiditySuccessModal'; // Import the success modal

type LpTokenInfo = { address: Address; symbol: string; decimals: number; balance: bigint };

export function AddLiquidityForm() {
  const { chainId } = useAccount();
  const [discoveredLpToken, setDiscoveredLpToken] = useState<LpTokenInfo | null>(null);
  const { addTokenToWallet } = useWatchAsset();

  const {
    TOKENS, tokenA, tokenB, amountA, amountB, balanceA, balanceB,
    handleSelectToken, handleAmountAChange, handleAmountBChange,
    isModalOpen, openModal, closeModal, modalType, reserves,
  } = useLiquidityState();

  // --- MODIFIED: Define the success handler ---
  const onLiquidityAdded = (lpToken: LpTokenInfo) => {
    handleAmountAChange("");
    handleAmountBChange("");
    setDiscoveredLpToken(lpToken); // This will open the success modal
  };

  const liquidityManagerAddress = chainId
    ? (pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LiquidityManager as Address | undefined)
    : undefined;

  const { allowance: allowanceA, approve: approveA, isLoading: isApprovingA } = useTokenApproval(
    tokenA?.address, liquidityManagerAddress
  );
  const { allowance: allowanceB, approve: approveB, isLoading: isApprovingB } = useTokenApproval(
    tokenB?.address, liquidityManagerAddress
  );

  // --- MODIFIED: Pass the success handler to the hook ---
  const { addLiquidity, addLiquidityBNB, isLoading: isWriting } = useLiquidity({
    onAddSuccess: onLiquidityAdded,
  });

  const isAmountAValid = useMemo(() => isValidNumberInput(amountA), [amountA]);
  const isAmountBValid = useMemo(() => isValidNumberInput(amountB), [amountB]);

  const hasSufficientBalanceA = useMemo(() => {
    if (!isAmountAValid || !balanceA) return false;
    return parseUnits(amountA || "0", balanceA.decimals) <= balanceA.value;
  }, [amountA, balanceA, isAmountAValid]);

  const hasSufficientBalanceB = useMemo(() => {
    if (!isAmountBValid || !balanceB) return false;
    return parseUnits(amountB || "0", balanceB.decimals) <= balanceB.value;
  }, [amountB, balanceB, isAmountBValid]);

  const needsApprovalA =
    tokenA && isAmountAValid && hasSufficientBalanceA && tokenA.symbol !== "BNB" &&
    (!allowanceA || allowanceA < parseUnits(amountA || "0", tokenA.decimals));
  const needsApprovalB =
    tokenB && isAmountBValid && hasSufficientBalanceB && tokenB.symbol !== "BNB" &&
    (!allowanceB || allowanceB < parseUnits(amountB || "0", tokenB.decimals));
  
  const isBusy = isApprovingA || isApprovingB || isWriting;

  const handleAdd = async () => {
    if (!tokenA || !tokenB) return;
    
    // Define the action to run after approval (if needed)
    const run = async () => {
        const isA_BNB = tokenA.symbol === "BNB";
        const isB_BNB = tokenB.symbol === "BNB";
        if (isA_BNB || isB_BNB) {
          const otherToken = isA_BNB ? tokenB : tokenA;
          const amountToken = isA_BNB ? amountB : amountA;
          const amountBNB = isA_BNB ? amountA : amountB;
          await addLiquidityBNB(otherToken.address, amountToken, amountBNB);
        } else {
          await addLiquidity(tokenA.address, tokenB.address, amountA, amountB);
        }
    };

    if (needsApprovalA) { await approveA({ onSuccess: handleAdd }); return; }
    if (needsApprovalB) { await approveB({ onSuccess: handleAdd }); return; }
    
    await run();
  };

  const handlePercentClick = (tokenType: "A" | "B", percent: number) => {
    const balance = tokenType === "A" ? balanceA : balanceB;
    if (!balance) return;
    const newAmount = (balance.value * BigInt(percent)) / 100n;
    const formattedAmount = formatUnits(newAmount, balance.decimals);
    if (tokenType === "A") handleAmountAChange(formattedAmount);
    else handleAmountBChange(formattedAmount);
  };

  const buttonText = () => {
    if (!tokenA || !tokenB) return "Select tokens";
    if (!isAmountAValid || !isAmountBValid) return "Enter amounts";
    if (!hasSufficientBalanceA) return `Insufficient ${tokenA.symbol}`;
    if (!hasSufficientBalanceB) return `Insufficient ${tokenB.symbol}`;
    if (needsApprovalA) return `Approve ${tokenA.symbol}`;
    if (needsApprovalB) return `Approve ${tokenB.symbol}`;
    return "Add Liquidity";
  };

  if (!tokenA || !tokenB) {
    return (
      <Card className="max-w-md mx-auto"><CardHeader><CardTitle>Add V2 Liquidity</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center p-8"><Spinner /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Add V2 Liquidity</CardTitle>
          <CardDescription>Provide liquidity to earn fees.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg border bg-greyscale-50 dark:bg-dark-surface space-y-2">
            <div className="flex items-center justify-between">
              <button className="text-sm font-medium" onClick={() => openModal("A")}>{tokenA.symbol}</button>
              {balanceA && (<span className="text-xs text-gray-500">Balance: {formatUnits(balanceA.value, balanceA.decimals)}</span>)}
            </div>
            <input className="w-full bg-transparent text-2xl outline-none" value={amountA} onChange={(e) => handleAmountAChange(e.target.value)} placeholder="0.0" disabled={isBusy} />
            <div className="flex justify-end gap-2">
              {[25, 50, 75, 100].map((p) => (<Button key={p} size="sm" variant="secondary" onClick={() => handlePercentClick("A", p)} disabled={isBusy || !balanceA || balanceA.value === 0n}>{p === 100 ? "MAX" : `${p}%`}</Button>))}
            </div>
          </div>
          <div className="flex justify-center text-2xl font-bold text-gray-400">+</div>
          <div className="p-4 rounded-lg border bg-greyscale-50 dark:bg-dark-surface space-y-2">
            <div className="flex items-center justify-between">
              <button className="text-sm font-medium" onClick={() => openModal("B")}>{tokenB.symbol}</button>
              {balanceB && (<span className="text-xs text-gray-500">Balance: {formatUnits(balanceB.value, balanceB.decimals)}</span>)}
            </div>
            <input className="w-full bg-transparent text-2xl outline-none" value={amountB} onChange={(e) => handleAmountBChange(e.target.value)} placeholder="0.0" disabled={isBusy} />
            <div className="flex justify-end gap-2">
              {[25, 50, 75, 100].map((p) => (<Button key={p} size="sm" variant="secondary" onClick={() => handlePercentClick("B", p)} disabled={isBusy || !balanceB || balanceB.value === 0n}>{p === 100 ? "MAX" : `${p}%`}</Button>))}
            </div>
          </div>
          {reserves.reserveA > 0n && reserves.reserveB > 0n && (
            <div className="text-xs text-center text-gray-500 pt-2 p-3 border rounded-md bg-muted/50">
              <p className="font-semibold mb-1">Current Pool Rates</p>
              <p>1 {tokenA.symbol} = {Number(formatUnits((reserves.reserveB * (10n ** BigInt(tokenA.decimals))) / reserves.reserveA, tokenB.decimals)).toLocaleString(undefined, { maximumFractionDigits: 8 })} {tokenB.symbol}</p>
              <p>1 {tokenB.symbol} = {Number(formatUnits((reserves.reserveA * (10n ** BigInt(tokenB.decimals))) / reserves.reserveB, tokenA.decimals)).toLocaleString(undefined, { maximumFractionDigits: 8 })} {tokenA.symbol}</p>
            </div>
          )}
          <Button onClick={handleAdd} className="w-full" disabled={isBusy || !isAmountAValid || !isAmountBValid || !hasSufficientBalanceA || !hasSufficientBalanceB}>
            {isBusy && <Spinner className="mr-2 h-4 w-4" />}
            {buttonText()}
          </Button>
        </CardContent>
      </Card>
      
      {discoveredLpToken && (
         <LiquiditySuccessModal
            isOpen={!!discoveredLpToken}
            onClose={() => setDiscoveredLpToken(null)}
            lpAmount={discoveredLpToken.balance}
            lpTokenAddress={discoveredLpToken.address}
            lpTokenSymbol={discoveredLpToken.symbol}
        />
      )}

      <TokenSelectorModal isOpen={isModalOpen} onClose={closeModal} onSelect={handleSelectToken} tokenList={TOKENS} exclude={modalType === "A" ? [tokenB] : [tokenA]} />
    </>
  );
}