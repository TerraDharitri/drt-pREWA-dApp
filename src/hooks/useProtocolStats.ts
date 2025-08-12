// src/hooks/useProtocolStats.ts

"use client";

import { useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { TOKEN_LISTS } from "@/constants/tokens";
import { formatUnits, zeroAddress, isAddressEqual, Address } from "viem";

// Define the hook's return type for clarity and type safety
type ProtocolStatsReturn = {
  isLoading: boolean;
  prewaPrice: string;
  poolSizeUsd: string;
  prewaPriceRaw: number;
};

export function useProtocolStats(): ProtocolStatsReturn {
  const { chainId } = useAccount();

  // 1. Get constants for the current chain
  const addresses = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses] : undefined;
  const tokens = chainId ? TOKEN_LISTS[chainId as keyof typeof TOKEN_LISTS] : [];
  
  const pREWA = useMemo(() => tokens.find(t => t.symbol === 'pREWA'), [tokens]);
  const USDT = useMemo(() => tokens.find(t => t.symbol === 'USDT'), [tokens]);
  const routerAddress = addresses?.PancakeRouter;

  // 2. Get Factory address from Router to ensure we use the correct one
  const { data: factoryAddress, isLoading: isLoadingFactory } = useReadContract({
    address: routerAddress,
    abi: pREWAAbis.IPancakeRouter,
    functionName: 'factory',
    query: { enabled: !!routerAddress },
  });

  // 3. Get Pair address from Factory using pREWA and USDT addresses
  const { data: pairAddress, isLoading: isLoadingPairAddress } = useReadContract({
    address: factoryAddress as Address | undefined,
    abi: pREWAAbis.IPancakeFactory,
    functionName: 'getPair',
    args: [pREWA?.address!, USDT?.address!],
    query: { enabled: !!factoryAddress && !!pREWA?.address && !!USDT?.address },
  });

  // 4. Get live reserves from the Pair contract
  const { data: reservesData, isLoading: isLoadingReserves } = useReadContract({
    address: pairAddress as Address | undefined,
    abi: pREWAAbis.IPancakePair,
    functionName: 'getReserves',
    query: {
      enabled: !!pairAddress && pairAddress !== zeroAddress,
      refetchInterval: 10000, // Refetch every 10 seconds for live data
    },
  });

  // 5. Get token0 from the Pair contract to correctly identify the reserves
  const { data: token0AddressResult, isLoading: isLoadingToken0 } = useReadContract({
    address: pairAddress as Address | undefined,
    abi: pREWAAbis.IPancakePair,
    functionName: 'token0',
    query: {
      enabled: !!pairAddress && pairAddress !== zeroAddress,
    },
  });

  // 6. Calculate price and total pool value once all data is fetched
  const { prewaPrice, poolSizeUsd, prewaPriceRaw } = useMemo(() => {
    const token0Address = token0AddressResult as Address | undefined;

    if (!reservesData || !token0Address || !pREWA || !USDT || !Array.isArray(reservesData)) {
      return { prewaPrice: "0.00000000", poolSizeUsd: "0.00", prewaPriceRaw: 0 };
    }
    
    const [reserve0, reserve1] = reservesData as [bigint, bigint];

    const pREWAIsToken0 = isAddressEqual(pREWA.address, token0Address);
    const [reservePREWA, reserveUSDT] = pREWAIsToken0 ? [reserve0, reserve1] : [reserve1, reserve0];

    if (reservePREWA === 0n || reserveUSDT === 0n) {
      return { prewaPrice: "0.00000000", poolSizeUsd: "0.00", prewaPriceRaw: 0 };
    }

    // Price = (USDT reserves / pREWA reserves), adjusted for decimals
    const priceBigInt = (reserveUSDT * BigInt(10 ** pREWA.decimals)) / reservePREWA;
    const rawPrice = parseFloat(formatUnits(priceBigInt, USDT.decimals));
    const formattedPrice = rawPrice.toFixed(8);

    // Pool size = (USDT reserves * 2), formatted as currency
    const poolSizeBigInt = reserveUSDT * 2n;
    const formattedPoolSize = parseFloat(formatUnits(poolSizeBigInt, USDT.decimals)).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return { prewaPrice: formattedPrice, poolSizeUsd: formattedPoolSize, prewaPriceRaw: rawPrice };
  }, [reservesData, token0AddressResult, pREWA, USDT]);
  
  const isLoading = isLoadingFactory || isLoadingPairAddress || isLoadingReserves || isLoadingToken0;

  return {
    isLoading,
    prewaPrice,
    poolSizeUsd,
    prewaPriceRaw,
  };
}