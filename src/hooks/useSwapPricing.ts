// src/hooks/useSwapPricing.ts

"use client";
import { useReadContract } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { useAccount } from "wagmi";
import { Address, Abi, parseUnits, formatUnits } from "viem";
import { useDebounce } from "./useDebounce";
import { useMemo } from "react";
import { isValidNumberInput } from "@/lib/utils";

interface UseSwapPricingProps {
  fromToken: { address: Address; decimals: number; symbol: string };
  toToken: { address: Address; decimals: number; symbol: string };
  fromAmount: string;
}

export const useSwapPricing = ({ fromToken, toToken, fromAmount }: UseSwapPricingProps) => {
  const { chainId } = useAccount();
  const debouncedFromAmount = useDebounce(fromAmount, 500);

  const routerAddress = chainId
    ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.PancakeRouter
    : undefined;
  const liquidityManagerAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LiquidityManager : undefined;
  const pREWAAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.pREWAToken : undefined;

  const amountIn = isValidNumberInput(debouncedFromAmount) ? parseUnits(debouncedFromAmount, fromToken.decimals) : 0n;

  const { data: amountsOutData, isLoading: isLoadingAmounts, isError: isErrorAmounts } = useReadContract({
    address: routerAddress,
    abi: pREWAAbis.IPancakeRouter as Abi,
    functionName: "getAmountsOut",
    args: [amountIn, [fromToken.address, toToken.address]],
    query: {
      enabled: !!routerAddress && !!fromToken.address && !!toToken.address && amountIn > 0n && isValidNumberInput(debouncedFromAmount),
      select: (data: unknown) => {
        const result = data as bigint[];
        if (Array.isArray(result) && result.length > 1) {
          return formatUnits(result[1], toToken.decimals);
        }
        return "";
      },
    },
  });

  const otherTokenForPair = useMemo(() => {
    if (!pREWAAddress) return undefined;
    if (fromToken.address.toLowerCase() === pREWAAddress.toLowerCase()) return toToken;
    if (toToken.address.toLowerCase() === pREWAAddress.toLowerCase()) return fromToken;
    return undefined;
  }, [fromToken, toToken, pREWAAddress]);

  const { data: pairInfo, isLoading: isLoadingPairInfo } = useReadContract({
    address: liquidityManagerAddress,
    abi: pREWAAbis.ILiquidityManager,
    functionName: 'getPairInfo',
    args: [otherTokenForPair?.address!],
    query: {
        enabled: !!liquidityManagerAddress && !!otherTokenForPair,
        refetchInterval: 10000,
    }
  });

  const reserves = useMemo(() => {
    if (!pairInfo || !Array.isArray(pairInfo) || (pairInfo[0] as Address).toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return undefined;
    }
    
    const [, , , reserve0, reserve1, pREWAIsToken0, ] = pairInfo as [Address, Address, boolean, bigint, bigint, boolean, number];
    
    const isFromTokenPREWA = fromToken.address.toLowerCase() === pREWAAddress?.toLowerCase();
    
    if (isFromTokenPREWA) {
        return pREWAIsToken0 ? { reserveA: reserve0, reserveB: reserve1 } : { reserveA: reserve1, reserveB: reserve0 };
    } else { 
        return pREWAIsToken0 ? { reserveA: reserve1, reserveB: reserve0 } : { reserveA: reserve0, reserveB: reserve1 };
    }
  }, [pairInfo, fromToken.address, pREWAAddress]);

  return {
    toAmount: amountsOutData || "",
    reserves,
    isLoading: (isLoadingAmounts || isLoadingPairInfo) && amountIn > 0,
    isError: isErrorAmounts,
  };
};