// src/hooks/useSwapPricing.ts
"use client";
import { useMemo, useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { pREWAAddresses, pREWAAbis } from '@/constants';
import { Token } from '@/constants/tokens';
import { Address, formatUnits, isAddressEqual, parseUnits, zeroAddress } from 'viem';
import { useDebounce } from './useDebounce';
import { Field } from './useSwapState';

interface UseSwapPricingProps {
    fromToken?: Token;
    toToken?: Token;
    amounts: { from: string; to: string };
    independentField: Field;
}

export const useSwapPricing = ({ fromToken, toToken, amounts, independentField }: UseSwapPricingProps) => {
    const { chainId } = useAccount();
    
    const debouncedFromAmount = useDebounce(amounts.from, 300);
    const debouncedToAmount = useDebounce(amounts.to, 300);

    const routerAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.PancakeRouter : undefined;
    const { data: factoryAddress } = useReadContract({
        address: routerAddress,
        abi: pREWAAbis.IPancakeRouter,
        functionName: 'factory',
        query: { enabled: !!routerAddress },
    });

    const { data: pairAddress } = useReadContract({
        address: factoryAddress as Address | undefined,
        abi: pREWAAbis.IPancakeFactory,
        functionName: 'getPair',
        args: [fromToken?.address!, toToken?.address!],
        query: { enabled: !!factoryAddress && !!fromToken && !!toToken },
    });

    const { data: reservesData, isLoading } = useReadContract({
        address: pairAddress as Address | undefined,
        abi: pREWAAbis.IPancakePair,
        functionName: 'getReserves',
        query: {
            enabled: !!pairAddress && pairAddress !== zeroAddress,
            refetchInterval: 5000,
        },
    });

    const { data: token0Address } = useReadContract({
        address: pairAddress as Address | undefined,
        abi: pREWAAbis.IPancakePair,
        functionName: 'token0',
        query: { enabled: !!pairAddress && pairAddress !== zeroAddress },
    });

    const [calculatedAmount, setCalculatedAmount] = useState('');

    useEffect(() => {
        if (!reservesData || !token0Address || !fromToken || !toToken || !Array.isArray(reservesData)) return;

        const [reserve0, reserve1] = reservesData as [bigint, bigint];
        const fromIsToken0 = isAddressEqual(fromToken.address, token0Address as Address);
        const [reserveIn, reserveOut] = fromIsToken0 ? [reserve0, reserve1] : [reserve1, reserve0];

        if (independentField === 'from' && debouncedFromAmount) {
            try {
                const amountIn = parseUnits(debouncedFromAmount, fromToken.decimals);
                if (amountIn === 0n) { setCalculatedAmount(''); return; }
                const amountOut = (amountIn * 997n * reserveOut) / (reserveIn * 1000n + amountIn * 997n);
                setCalculatedAmount(formatUnits(amountOut, toToken.decimals));
            } catch { setCalculatedAmount(''); }
        } else if (independentField === 'to' && debouncedToAmount) {
            try {
                const amountOut = parseUnits(debouncedToAmount, toToken.decimals);
                if (amountOut === 0n) { setCalculatedAmount(''); return; }
                // Prevent calculation if desired output exceeds pool reserves
                if (amountOut >= reserveOut) { setCalculatedAmount(''); return; }
                const amountIn = (reserveIn * amountOut * 1000n) / ((reserveOut - amountOut) * 997n) + 1n;
                setCalculatedAmount(formatUnits(amountIn, fromToken.decimals));
            } catch { setCalculatedAmount(''); }
        } else {
            setCalculatedAmount('');
        }
    }, [debouncedFromAmount, debouncedToAmount, independentField, fromToken, toToken, reservesData, token0Address]);
    
    // FIX: Expose reserves in a structured way for the UI to use
    const reserves = useMemo(() => {
        if (!reservesData || !Array.isArray(reservesData) || !token0Address || !fromToken || !toToken) return undefined;
        const [reserve0, reserve1] = reservesData as [bigint, bigint];
        const fromIsToken0 = isAddressEqual(fromToken.address, token0Address as Address);
        return fromIsToken0 
            ? { from: reserve0, to: reserve1 } 
            : { from: reserve1, to: reserve0 };
    }, [reservesData, token0Address, fromToken, toToken]);

    return {
        isLoading,
        reserves,
        toAmount: independentField === 'from' ? calculatedAmount : amounts.to,
        fromAmount: independentField === 'to' ? calculatedAmount : amounts.from,
    };
};