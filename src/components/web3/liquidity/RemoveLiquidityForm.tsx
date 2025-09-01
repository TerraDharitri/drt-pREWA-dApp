"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useAccount, useBalance } from "wagmi";
import { pREWAAddresses } from "@/constants";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useLiquidity } from "@/hooks/useLiquidity";
import { useReadLiquidityPositions, LiquidityPosition } from "@/hooks/useReadLiquidityPositions";
import { TOKEN_LISTS } from "@/constants/tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { parseUnits, formatUnits, isAddressEqual } from "viem";
import { formatAddress } from "@/lib/web3-utils";
import toast from "react-hot-toast";
import { isValidNumberInput } from "@/lib/utils";
import { safeFind, toArray } from "@/utils/safe";


export function RemoveLiquidityForm() {
  const { address, chainId } = useAccount();
  const liquidityManagerAddress =
    chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LiquidityManager : undefined;

  const { positions: availableLPs, isLoading: isLoadingLPs, refetch: refetchLPs } = useReadLiquidityPositions();

  const [selectedLp, setSelectedLp] = useState<LiquidityPosition | undefined>();
  const [lpAmount, setLpAmount] = useState("");

  useEffect(() => {
    if (availableLPs.length > 0 && !selectedLp) setSelectedLp(availableLPs[0]);
    if (availableLPs.length === 0) setSelectedLp(undefined);
  }, [availableLPs, selectedLp]);

  const { data: lpBalance } = useBalance({
    address,
    token: selectedLp?.lpTokenAddress,
    query: { enabled: !!selectedLp },
  });

  const { allowance, approve, isLoading: isApproving } = useTokenApproval(
    selectedLp?.lpTokenAddress,
    liquidityManagerAddress
  );
  const { removeLiquidity, removeLiquidityBNB, isLoading: isRemoving } = useLiquidity();

  const isAmountValid = useMemo(() => isValidNumberInput(lpAmount), [lpAmount]);

  const hasSufficientBalance = useMemo(() => {
    if (!isAmountValid || !lpBalance) return false;
    return parseUnits(lpAmount || "0", lpBalance.decimals) <= lpBalance.value;
  }, [lpAmount, lpBalance, isAmountValid]);

  const needsApproval =
    isAmountValid &&
    hasSufficientBalance &&
    selectedLp &&
    lpBalance &&
    lpBalance.value > 0n &&
    (!allowance || allowance < parseUnits(lpAmount || "0", 18));

  const isLoading = isApproving || isRemoving || isLoadingLPs;

  const handleRemove = async () => {
    if (!selectedLp || !isAmountValid || !hasSufficientBalance) {
      toast.error("Please enter a valid amount to remove.");
      return;
    }

    const tokens = chainId ? TOKEN_LISTS[chainId as keyof typeof TOKEN_LISTS] : [];
      const isBNBPair = safeFind<typeof tokens[number]>(
      tokens,
      (t) => t?.symbol === "BNB" && isAddressEqual(t?.address!, selectedLp?.otherTokenAddress!)
    );


    const run = async () => {
      if (isBNBPair) await removeLiquidityBNB(lpAmount);
      else await removeLiquidity(selectedLp.otherTokenAddress, lpAmount);
      setLpAmount("");
      toast.success("Balances will update shortly.");
      refetchLPs();
    };

    if (needsApproval) {
      await approve();
      await run();
    } else {
      await run();
    }
  };

  const poolOptions = useMemo(() => {
    const tokens = chainId ? TOKEN_LISTS[chainId as keyof typeof TOKEN_LISTS] : [];
    return availableLPs.map((lp) => {
      const otherTokenInfo = safeFind<typeof tokens[number]>(tokens,  (t) => isAddressEqual(t?.address!, lp?.otherTokenAddress!));

      const name = otherTokenInfo ? `pREWA / ${otherTokenInfo.symbol}` : `pREWA / ${formatAddress(lp.otherTokenAddress)}`;
      return { ...lp, name };
    });
  }, [availableLPs, chainId]);

  const handlePercentClick = (percent: number) => {
    if (!lpBalance) return;
    const newAmount = (lpBalance.value * BigInt(percent)) / 100n;
    setLpAmount(formatUnits(newAmount, lpBalance.decimals));
  };

  const buttonText = () => {
    if (availableLPs.length === 0) return "No LP Tokens Found";
    if (!isAmountValid) return "Enter an amount";
    if (!hasSufficientBalance) return "Insufficient Balance";
    if (needsApproval) return "Approve LP Token";
    return "Remove Liquidity";
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Remove Liquidity</CardTitle>
        <CardDescription>Select a pool and the amount of LP tokens to burn.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Select Pool</label>
          <select
            value={selectedLp?.id || ""}
            onChange={(e) => {
              const selected = safeFind<typeof poolOptions[number]>(poolOptions, (p) => p?.id === e.target.value);
              setSelectedLp(selected);
              setLpAmount("");
            }}
            disabled={isLoadingLPs || poolOptions.length === 0}
            className="w-full p-2 border rounded-md bg-transparent dark:bg-dark-surface dark:border-dark-border disabled:opacity-50"
          >
            {isLoadingLPs && <option>Loading pools...</option>}
            {!isLoadingLPs && poolOptions.length === 0 && <option>No LP tokens in wallet</option>}
            {poolOptions.map((pool) => (
              <option key={pool.id} value={pool.id}>
                {pool.name}
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 rounded-lg bg-greyscale-50 dark:bg-dark-surface space-y-2 border">
          <div className="mb-1 flex items-baseline justify-between">
            <label className="text-sm">Amount to Remove</label>
            {lpBalance && (
              <span className="text-xs text-gray-500">
                Balance: {formatUnits(lpBalance.value, lpBalance.decimals)}
              </span>
            )}
          </div>
          <Input
            type="text"
            value={lpAmount}
            onChange={(e) => setLpAmount(e.target.value)}
            placeholder="0.0"
            disabled={isLoading || !selectedLp}
            className="web3-input !text-2xl !h-auto !p-0 !border-0 focus:!ring-0 bg-transparent"
          />
          <div className="flex justify-end gap-2">
            {[25, 50, 75, 100].map((p) => (
              <Button
                key={p}
                size="sm"
                variant="secondary"
                onClick={() => handlePercentClick(p)}
                disabled={!lpBalance || lpBalance.value === 0n}
              >
                {p === 100 ? "MAX" : `${p}%`}
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleRemove}
          className="w-full"
          disabled={isLoading || !isAmountValid || !selectedLp || !hasSufficientBalance}
        >
          {isLoading && <Spinner className="mr-2 h-4 w-4" />}
          {buttonText()}
        </Button>
      </CardContent>
    </Card>
  );
}