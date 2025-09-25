// src/hooks/usePrewaUsdPrice.ts
"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { TOKEN_LISTS } from "@/constants/tokens";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { safeFind } from "@/utils/safe";

export function usePrewaUsdPrice() {
  const { chainId } = useAccount();
  const tokens = TOKEN_LISTS[chainId as keyof typeof TOKEN_LISTS] || [];
  const usdt  = safeFind<typeof tokens[number]>(tokens, (t) => t?.symbol === "USDT");
  const prewa = safeFind<typeof tokens[number]>(tokens, (t) => t?.symbol === "pREWA");
  const prewaAddr = pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.pREWAToken;
  const liquidityManager = pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LiquidityManager;

  const enabled = !!chainId && !!usdt && !!prewaAddr && !!liquidityManager;

  const { data, isLoading } = useReadContract({
    address: liquidityManager as `0x${string}`,
    abi: pREWAAbis.ILiquidityManager,
    functionName: "getPairInfo",
    args: [usdt?.address as `0x${string}`],
    query: { enabled, refetchInterval: 20_000 },
  });
  
  // Return early if not enabled, loading, or no data
  if (!enabled || isLoading || !data) {
    // MODIFIED: Return isLoading state here
    return { priceUsd: undefined as number | undefined, isLoading: isLoading || !enabled };
  }

  const [, , , reserve0, reserve1, pREWAIsToken0] = data as any;
  
  const prewaDecimals = (tokens.find((t) => t.symbol === "pREWA")?.decimals ?? 18) as number;
  const usdtDecimals = (usdt?.decimals ?? 18) as number;

  const prewaRes = pREWAIsToken0 ? reserve0 : reserve1;
  const usdtRes  = pREWAIsToken0 ? reserve1 : reserve0;

  const prewaFloat = Number(formatUnits(prewaRes as bigint, prewaDecimals));
  const usdtFloat  = Number(formatUnits(usdtRes as bigint, usdtDecimals));

  const priceUsd = prewaFloat > 0 ? usdtFloat / prewaFloat : undefined;
  
  // MODIFIED: Return isLoading state in the success case as well
  return { priceUsd, isLoading };
}