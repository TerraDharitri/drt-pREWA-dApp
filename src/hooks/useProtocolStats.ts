// src/hooks/useProtocolStats.ts

"use client";
import { useAccount, useReadContracts } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { TOKEN_LIST_TESTNET } from "@/constants/tokens";
import { Abi, Address, formatUnits } from "viem";
import { useMemo } from "react";

export const useProtocolStats = () => {
    const { chainId } = useAccount();

    const oracleIntegration = {
        address: chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.OracleIntegration : undefined,
        abi: pREWAAbis.OracleIntegration as Abi,
    };

    const liquidityManager = {
        address: chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LiquidityManager : undefined,
        abi: pREWAAbis.ILiquidityManager as Abi,
    };
    
    const pREWAAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.pREWAToken : undefined;
    const usdtAddress = TOKEN_LIST_TESTNET.find(t => t.symbol === 'USDT')?.address;

    const { data: statsData, isLoading } = useReadContracts({
        contracts: [
            {
                ...oracleIntegration,
                functionName: 'getTokenPrice',
                args: [pREWAAddress!],
            },
            {
                ...liquidityManager,
                functionName: 'getPairInfo',
                args: [usdtAddress!],
            }
        ],
        query: {
            enabled: !!oracleIntegration.address && !!liquidityManager.address && !!usdtAddress && !!pREWAAddress,
            refetchInterval: 10000,
        }
    });

    const stats = useMemo(() => {
        if (!statsData || statsData[0].status !== 'success' || statsData[1].status !== 'success' || !pREWAAddress) {
            return { prewaPrice: "0.0000", poolSizeUsd: "0.00" };
        }

        const [priceResult] = statsData[0].result as [bigint, boolean, bigint];
        const pairInfo = statsData[1].result;

        const prewaPrice = priceResult;
        const formattedPrice = parseFloat(formatUnits(prewaPrice, 18)).toFixed(4);

        const [, , , reserve0, reserve1, pREWAIsToken0] = pairInfo as [Address, Address, boolean, bigint, bigint, boolean, number];
        
        if (reserve0 === 0n || reserve1 === 0n) {
             return { prewaPrice: formattedPrice, poolSizeUsd: "0.00" };
        }

        const { prewaReserve, usdtReserve } = pREWAIsToken0
            ? { prewaReserve: reserve0, usdtReserve: reserve1 }
            : { prewaReserve: reserve1, usdtReserve: reserve0 };
        
        const prewaValueInUsdt = (prewaReserve * prewaPrice) / 10n**18n;
        const totalValueInUsdt = prewaValueInUsdt + usdtReserve;
        const formattedPoolSize = parseFloat(formatUnits(totalValueInUsdt, 18)).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        return {
            prewaPrice: formattedPrice,
            poolSizeUsd: formattedPoolSize,
        };

    }, [statsData, pREWAAddress]);

    return {
        isLoading,
        ...stats,
    };
};