// src/hooks/useReadLiquidityPositions.ts

"use client";

import { useAccount, usePublicClient } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { TOKEN_LIST_TESTNET } from "@/constants/tokens";
import { Abi, Address } from "viem";
import { useQuery } from "@tanstack/react-query";
import { safeFind } from "@/utils/safe";

export interface LiquidityPosition {
    id: string;
    lpTokenAddress: Address;
    otherTokenAddress: Address;
    currentLpBalance: bigint;
}

export const useReadLiquidityPositions = () => {
    const { address, chainId } = useAccount();
    const publicClient = usePublicClient();

    const getLiquidityManagerConfig = () => {
        if (!chainId) return undefined;
        const address = pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LiquidityManager;
        if (!address) return undefined;
        return { address, abi: pREWAAbis.LiquidityManager as Abi };
    };

    const liquidityManager = getLiquidityManagerConfig();

    const queryKey = ['userUnstakedLpTokenBalances', chainId, address];

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            // FIX: Re-check for address inside the query function to satisfy TypeScript
            if (!address || !liquidityManager?.address || !publicClient) {
                return [];
            }

            const supportedOtherTokens: Address[] = [
                safeFind<typeof TOKEN_LIST_TESTNET[number]>(TOKEN_LIST_TESTNET, (t) => t?.symbol === "BNB")?.address,
                safeFind<typeof TOKEN_LIST_TESTNET[number]>(TOKEN_LIST_TESTNET, (t) => t?.symbol === "USDT")?.address,
            ].filter((t): t is Address => !!t);


            if (supportedOtherTokens.length === 0) return [];

            const getLpAddressCalls = supportedOtherTokens.map(tokenAddr => ({
                ...liquidityManager,
                functionName: 'getLPTokenAddress',
                args: [tokenAddr]
            }));

            const lpAddressResults = await publicClient.multicall({ 
                contracts: getLpAddressCalls,
                allowFailure: true 
            });

            const validLpTokens: { lpTokenAddress: Address; otherTokenAddress: Address }[] = [];
            lpAddressResults.forEach((result, index) => {
                if (result.status === 'success' && result.result) {
                    validLpTokens.push({
                        lpTokenAddress: result.result as Address,
                        otherTokenAddress: supportedOtherTokens[index],
                    });
                }
            });

            if (validLpTokens.length === 0) {
                return [];
            }

            const balanceCalls = validLpTokens.map(lpInfo => ({
                address: lpInfo.lpTokenAddress,
                abi: pREWAAbis.pREWAToken as Abi,
                functionName: 'balanceOf',
                args: [address]
            }));

            const balanceResults = await publicClient.multicall({ 
                contracts: balanceCalls, 
                allowFailure: true 
            });

            const finalPositions: LiquidityPosition[] = [];
            balanceResults.forEach((balanceResult, index) => {
                if (balanceResult.status === 'success' && (balanceResult.result as bigint) > 0n) {
                    const lpInfo = validLpTokens[index];
                    finalPositions.push({
                        id: lpInfo.lpTokenAddress,
                        lpTokenAddress: lpInfo.lpTokenAddress,
                        otherTokenAddress: lpInfo.otherTokenAddress,
                        currentLpBalance: balanceResult.result as bigint,
                    });
                }
            });

            return finalPositions;
        },
        enabled: !!address && !!liquidityManager?.address && !!publicClient,
    });

    return {
        positions: data || [],
        isLoading,
        isError,
        refetch
    };
};