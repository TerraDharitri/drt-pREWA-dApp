// src/components/web3/swap/SwapCard.tsx

"use client";
import React, { useMemo } from "react";
import { useAccount, useBalance } from "wagmi";
import { pREWAAddresses } from "@/constants";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useSwap } from "@/hooks/useSwap";
import { useSwapPricing } from "@/hooks/useSwapPricing";
import { useSwapState } from "@/hooks/useSwapState";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { parseUnits, Address, formatUnits } from "viem";
import { ChevronDown } from "lucide-react";
import { TokenSelectorModal } from "./TokenSelectorModal";
import Image from 'next/image';
import { isValidNumberInput } from "@/lib/utils";

const TokenButton = ({ token, onClick }: { token: any, onClick: () => void }) => (
  <Button variant="ghost" className="h-auto px-2 py-1" onClick={onClick}>
    <Image src={token.logoURI} alt={token.symbol} width={24} height={24} className="rounded-full mr-2" />
    {token.symbol}
    <ChevronDown className="ml-1 h-4 w-4" />
  </Button>
);

export function SwapCard() {
  const { address, chainId } = useAccount();
  const {
    TOKENS, fromToken, toToken, fromAmount,
    setAmount, flipTokens, handleSelectToken,
    isModalOpen, modalType, openModal, closeModal
  } = useSwapState();

  const isAmountValid = useMemo(() => isValidNumberInput(fromAmount), [fromAmount]);

  const { data: fromTokenBalance } = useBalance({
    address: address,
    token: fromToken?.symbol !== 'BNB' ? fromToken.address : undefined,
    query: { enabled: !!fromToken }
  });

  const { data: toTokenBalance } = useBalance({
    address: address,
    token: toToken?.symbol !== 'BNB' ? toToken.address : undefined,
    query: { enabled: !!toToken }
  });

  const routerAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.PancakeRouter : undefined;
  
  const { toAmount, reserves, isLoading: isFetchingPrice } = useSwapPricing({ fromToken, toToken, fromAmount });
  const { allowance, approve, isLoading: isApproving } = useTokenApproval(
    fromToken?.symbol !== 'BNB' ? fromToken.address : undefined,
    routerAddress
  );
  const { swap, isLoading: isSwapping } = useSwap();

  const needsApproval = 
    isAmountValid &&
    fromToken?.symbol !== 'BNB' &&
    (!allowance || allowance < parseUnits(fromAmount, fromToken.decimals));
  
  const isLoading = isApproving || isSwapping;

  const handlePercentClick = (percent: number) => {
    if (!fromTokenBalance) return;
    const newAmount = (fromTokenBalance.value * BigInt(percent)) / 100n;
    setAmount(formatUnits(newAmount, fromTokenBalance.decimals));
  };
  
  const handleSwap = () => {
    if (needsApproval) {
      approve({ onSuccess: () => swap(fromToken, toToken, fromAmount, toAmount) });
    } else {
      swap(fromToken, toToken, fromAmount, toAmount);
    }
  };

  return (
    <>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Token Swap</CardTitle>
          <CardDescription>Exchange pREWA and other assets seamlessly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="p-3 border rounded-md bg-greyscale-25 dark:bg-dark-surface space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="text-xs text-greyscale-400">From</label>
                {fromTokenBalance && (
                    <span className="text-xs text-greyscale-400">
                        Balance: {parseFloat(formatUnits(fromTokenBalance.value, fromTokenBalance.decimals)).toFixed(5)}
                    </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                  <Input value={fromAmount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" type="text" className="web3-input !border-0 !px-0 !h-auto !text-2xl" />
                  {fromToken && <TokenButton token={fromToken} onClick={() => openModal('from')} />}
              </div>
              <div className="flex justify-end gap-2">
                {[25, 50, 75, 100].map(p => (
                    <Button key={p} size="sm" variant="secondary" onClick={() => handlePercentClick(p)} disabled={!fromTokenBalance || fromTokenBalance.value === 0n}>
                        {p === 100 ? 'MAX' : `${p}%`}
                    </Button>
                ))}
              </div>
          </div>
          
          <div className="flex justify-center py-1">
            <Button onClick={flipTokens} size="icon" variant="ghost" className="h-8 w-8 rounded-full border bg-background hover:bg-accent">↓</Button>
          </div>
          
          <div className="p-3 border rounded-md bg-greyscale-25 dark:bg-dark-surface">
              <div className="flex justify-between items-baseline">
                <label className="text-xs text-greyscale-400">To (estimated)</label>
                {toTokenBalance && (
                    <span className="text-xs text-greyscale-400">
                        Balance: {parseFloat(formatUnits(toTokenBalance.value, toTokenBalance.decimals)).toFixed(5)}
                    </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                  <Input value={isFetchingPrice ? '...' : toAmount} placeholder="0.0" type="text" readOnly className="web3-input !border-0 !px-0 !h-auto !text-2xl" />
                  {toToken && <TokenButton token={toToken} onClick={() => openModal('to')} />}
              </div>
          </div>

          {reserves && fromToken && toToken && reserves.reserveA > 0n && reserves.reserveB > 0n && (
            <Card className="bg-greyscale-25 dark:bg-dark-surface !mt-4">
                <CardContent className="text-sm p-3 space-y-2">
                    <h4 className="font-semibold">Current Pool Rates</h4>
                    <div className="flex justify-between"><span>1 {fromToken.symbol} = {formatUnits(reserves.reserveB * (10n ** 18n) / reserves.reserveA, 18)} {toToken.symbol}</span></div>
                    <div className="flex justify-between"><span>1 {toToken.symbol} = {formatUnits(reserves.reserveA * (10n ** 18n) / reserves.reserveB, 18)} {fromToken.symbol}</span></div>
                </CardContent>
            </Card>
          )}

          <div className="pt-4">
            <Button onClick={handleSwap} disabled={isLoading || isFetchingPrice || !isAmountValid || !toAmount || !fromToken || !toToken} className="w-full">
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {needsApproval ? `Approve ${fromToken?.symbol}` : 'Swap'}
            </Button>
          </div>
        </CardContent>
      </Card>
      {fromToken && toToken && 
        <TokenSelectorModal
            isOpen={isModalOpen}
            onClose={closeModal}
            onSelect={handleSelectToken}
            tokenList={TOKENS}
            exclude={modalType === 'from' ? [toToken] : [fromToken]}
        />
      }
    </>
  );
}