// src/components/web3/swap/SwapCard.tsx
"use client";
import React, { useMemo } from "react";
import { useAccount, useBalance } from "wagmi";
import { pREWAAddresses } from "@/constants";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useSwap } from "@/hooks/useSwap";
import { useSwapPricing } from "@/hooks/useSwapPricing";
import { useSwapState } from "@/hooks/useSwapState";
import { useChainId } from "wagmi";
import PoolActivityPanel from "@/components/web3/swap/PoolActivityPanel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { parseUnits, Address, formatUnits } from "viem";
import { ChevronDown, ArrowUpDown } from "lucide-react";
import { TokenSelectorModal } from "./TokenSelectorModal";
import Image from "next/image";
import { isValidNumberInput } from "@/lib/utils";
import { Token } from "@/constants/tokens";

// NEW: one-liner tx logger imports
import { logTx } from "@/lib/logTx";
import { getAccount } from "@wagmi/core";
import { config as wagmiConfig } from "@/config/wagmi";

const TokenButton = ({
  token,
  onClick,
}: {
  token: Token;
  onClick: () => void;
}) => (
  <Button
    variant="ghost"
    className="h-auto px-2 py-1 flex items-center"
    onClick={onClick}
  >
    <Image
      src={token.logoURI}
      alt={token.symbol}
      width={24}
      height={24}
      className="rounded-full mr-2"
    />
    <span className="font-semibold">{token.symbol}</span>
    <ChevronDown className="ml-1 h-4 w-4" />
  </Button>
);

export function SwapCard() {
  const { address, chainId } = useAccount();
  const {
    TOKENS,
    fromToken,
    toToken,
    amounts,
    independentField,
    onAmountChange,
    flipTokens,
    handleSelectToken,
    isModalOpen,
    modalType,
    openModal,
    closeModal,
  } = useSwapState();

  const { from: fromAmount, to: toAmount } = amounts;

  const {
    toAmount: calculatedToAmount,
    fromAmount: calculatedFromAmount,
    reserves,
    isLoading: isFetchingPrice,
  } = useSwapPricing({
    fromToken,
    toToken,
    amounts,
    independentField,
  });

  const finalFromAmount =
    independentField === "to" ? calculatedFromAmount : fromAmount;
  const finalToAmount =
    independentField === "from" ? calculatedToAmount : toAmount;

  const isAmountValid = useMemo(
    () =>
      isValidNumberInput(finalFromAmount) ||
      isValidNumberInput(finalToAmount),
    [finalFromAmount, finalToAmount]
  );

  const { data: fromTokenBalance } = useBalance({
    address,
    token:
      fromToken && fromToken.symbol !== "BNB"
        ? (fromToken.address as Address)
        : undefined,
    query: { enabled: !!fromToken },
  });
  const { data: toTokenBalance } = useBalance({
    address,
    token:
      toToken && toToken.symbol !== "BNB"
        ? (toToken.address as Address)
        : undefined,
    query: { enabled: !!toToken },
  });

  const hasSufficientBalance = useMemo(() => {
    if (!fromAmount || !isValidNumberInput(fromAmount) || !fromTokenBalance)
      return false;
    return (
      parseUnits(fromAmount, fromTokenBalance.decimals) <=
      fromTokenBalance.value
    );
  }, [fromAmount, fromTokenBalance]);

  const insufficientLiquidity = useMemo(() => {
    if (
      independentField === "to" &&
      isValidNumberInput(toAmount) &&
      reserves?.to &&
      toToken
    ) {
      return parseUnits(toAmount, toToken.decimals) >= reserves.to;
    }
    return false;
  }, [toAmount, independentField, reserves, toToken]);

  const routerAddress = chainId
    ? (pREWAAddresses[chainId as keyof typeof pREWAAddresses]
        ?.PancakeRouter as Address | undefined)
    : undefined;

  const { allowance, approve, isLoading: isApproving } = useTokenApproval(
    fromToken && fromToken.symbol !== "BNB"
      ? (fromToken.address as Address)
      : undefined,
    routerAddress
  );
  const { swap, isLoading: isSwapping } = useSwap();

  const needsApproval = useMemo(() => {
    if (
      !fromToken ||
      !isAmountValid ||
      !hasSufficientBalance ||
      fromToken.symbol === "BNB" ||
      !fromTokenBalance
    )
      return false;
    return (
      !allowance ||
      allowance < parseUnits(fromAmount || "0", fromToken.decimals)
    );
  }, [
    isAmountValid,
    hasSufficientBalance,
    fromToken,
    fromTokenBalance,
    allowance,
    fromAmount,
  ]);

  const isLoading = isApproving || isSwapping;

  const handlePercentClick = (percent: number) => {
    if (!fromTokenBalance) return;
    onAmountChange(
      "from",
      formatUnits(
        (fromTokenBalance.value * BigInt(percent)) / 100n,
        fromTokenBalance.decimals
      )
    );
  };

  // ---- SWAP + LOG ---------------------------------------------------------
  const doSwapAndLog = async () => {
    if (!fromToken || !toToken) return;

    try {
      // `useSwap().swap` should return a tx hash or a result with `.hash`
      const res: any = await swap(
        fromToken,
        toToken,
        finalFromAmount,
        finalToAmount
      );

      const hash: string | undefined =
        typeof res === "string"
          ? res
          : typeof res?.hash === "string"
          ? res.hash
          : undefined;

      if (hash && hash.startsWith("0x")) {
        const { chainId: currentChain, address: acct } = getAccount(
          wagmiConfig
        );

        logTx({
          hash: hash as `0x${string}`,
          chainId: currentChain!, // watcher is tolerant
          kind: "swap",
          title: `Swap ${fromToken.symbol} → ${toToken.symbol}`,
          address: (acct ?? address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
          meta: {
            from: fromToken.symbol,
            to: toToken.symbol,
            amountIn: finalFromAmount,
            amountOut: finalToAmount,
          },
        });
      }
    } catch {
      // the global watcher / UI toasts will handle failure paths; nothing else to do here
    }
  };

  const handleSwap = () => {
    if (!fromToken || !toToken) return;
    if (needsApproval) {
      approve({ onSuccess: () => void doSwapAndLog() });
    } else {
      void doSwapAndLog();
    }
  };
  // ------------------------------------------------------------------------

  const getButtonText = () => {
    if (insufficientLiquidity) return "Insufficient Liquidity";
    if (!isValidNumberInput(fromAmount)) return "Enter an amount";
    if (!hasSufficientBalance)
      return `Insufficient ${fromToken?.symbol} Balance`;
    if (needsApproval) return `Approve ${fromToken?.symbol}`;
    return "Swap";
  };

  // FIX: Add the crucial loading guard here.
  if (!fromToken || !toToken) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Token Swap</CardTitle>
          <CardDescription>
            Exchange pREWA and other assets seamlessly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="p-3 border rounded-md bg-greyscale-25 dark:bg-dark-surface space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-xs text-greyscale-400">From</label>
              {fromTokenBalance && (
                <span className="text-xs text-greyscale-400">
                  Balance:{" "}
                  {parseFloat(
                    formatUnits(
                      fromTokenBalance.value,
                      fromTokenBalance.decimals
                    )
                  ).toFixed(5)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <Input
                value={finalFromAmount}
                onChange={(e) => onAmountChange("from", e.target.value)}
                placeholder="0.0"
                type="text"
                className="web3-input !border-0 !px-0 !h-auto !text-2xl"
              />
              <TokenButton token={fromToken} onClick={() => openModal("from")} />
            </div>
            <div className="flex justify-end gap-2">
              {[25, 50, 75, 100].map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant="secondary"
                  onClick={() => handlePercentClick(p)}
                  disabled={
                    !fromTokenBalance || fromTokenBalance.value === 0n
                  }
                >
                  {p === 100 ? "MAX" : `${p}%`}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-center py-1">
            <Button
              onClick={flipTokens}
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full border bg-background hover:bg-accent"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-3 border rounded-md bg-greyscale-25 dark:bg-dark-surface">
            <div className="flex justify-between items-baseline">
              <label className="text-xs text-greyscale-400">
                To (estimated)
              </label>
              {toTokenBalance && (
                <span className="text-xs text-greyscale-400">
                  Balance:{" "}
                  {parseFloat(
                    formatUnits(toTokenBalance.value, toTokenBalance.decimals)
                  ).toFixed(5)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <Input
                value={finalToAmount}
                onChange={(e) => onAmountChange("to", e.target.value)}
                placeholder="0.0"
                type="text"
                className="web3-input !border-0 !px-0 !h-auto !text-2xl"
              />
              <TokenButton token={toToken} onClick={() => openModal("to")} />
            </div>
          </div>

          {reserves && reserves.from > 0n && (
            <Card className="bg-greyscale-25 dark:bg-dark-surface !mt-4">
              <CardContent className="text-sm p-3 space-y-2">
                <h4 className="font-semibold">Current Pool Rates</h4>
                <div className="flex justify-between">
                  <span>
                    1 {fromToken.symbol} ={" "}
                    {formatUnits(
                      (reserves.to * 10n ** BigInt(fromToken.decimals)) /
                        reserves.from,
                      toToken.decimals
                    )}{" "}
                    {toToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    1 {toToken.symbol} ={" "}
                    {formatUnits(
                      (reserves.from * 10n ** BigInt(toToken.decimals)) /
                        reserves.to,
                      fromToken.decimals
                    )}{" "}
                    {fromToken.symbol}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="pt-4">
            <Button
              onClick={handleSwap}
              disabled={
                isLoading ||
                isFetchingPrice ||
                !isAmountValid ||
                !hasSufficientBalance ||
                insufficientLiquidity
              }
              className="w-full"
            >
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {getButtonText()}
            </Button>
          </div>
        </CardContent>
      </Card>
      {fromToken && toToken && (
        <TokenSelectorModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSelect={handleSelectToken}
          tokenList={TOKENS}
        />
      )}
    </>
  );
}
