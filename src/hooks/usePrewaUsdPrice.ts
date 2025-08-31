// src/hooks/usePrewaUsdPrice.ts
"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { TOKEN_LISTS } from "@/constants/tokens";
import { pREWAAddresses, pREWAAbis } from "@/constants";

export function usePrewaUsdPrice() {
  const { chainId } = useAccount();
  const tokens = TOKEN_LISTS[chainId as keyof typeof TOKEN_LISTS] || [];
  const usdt = tokens.find((t) => t.symbol === "USDT");
  const prewaAddr =
    pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.pREWAToken;
  const liquidityManager =
    pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LiquidityManager;

  const enabled = !!chainId && !!usdt && !!prewaAddr && !!liquidityManager;

  const { data, isLoading } = useReadContract({
    address: liquidityManager as `0x${string}`,
    abi: pREWAAbis.ILiquidityManager,
    functionName: "getPairInfo",
    args: [usdt?.address as `0x${string}`],
    query: { enabled, refetchInterval: 20_000 },
  });

  if (!enabled || isLoading || !data) return { priceUsd: undefined as number | undefined };

  const [, , , reserve0, reserve1, pREWAIsToken0] = data as any;

  const prewaDecimals = (tokens.find((t) => t.symbol === "pREWA")?.decimals ?? 18) as number;
  const usdtDecimals = (usdt?.decimals ?? 18) as number;

  const prewaRes = pREWAIsToken0 ? reserve0 : reserve1;
  const usdtRes  = pREWAIsToken0 ? reserve1 : reserve0;

  const prewaFloat = Number(formatUnits(prewaRes as bigint, prewaDecimals));
  const usdtFloat  = Number(formatUnits(usdtRes as bigint, usdtDecimals));

  const priceUsd = prewaFloat > 0 ? usdtFloat / prewaFloat : undefined;
  return { priceUsd };
}