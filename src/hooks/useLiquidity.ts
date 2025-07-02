"use client";
import React, { useEffect } from 'react';
import { useAccount, useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from 'wagmi';
import { pREWAAddresses, pREWAAbis } from '@/constants';
import { parseUnits, parseEther, Address } from 'viem';
import toast from 'react-hot-toast';

export const useLiquidity = () => {
    const { chainId } = useAccount();
    const contractAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LiquidityManager : undefined;
    const { writeContractAsync, isPending, data: hash } = useWriteContract();

    const executeLiquidityTask = async (functionName: string, args: any[], toastId: string, value?: bigint) => {
        try {
            // @ts-ignore
            const { request } = await useSimulateContract({ address: contractAddress, abi: pREWAAbis.LiquidityManager, functionName, args, value });
            toast.loading('Awaiting signature...', { id: toastId });
            await writeContractAsync(request);
            toast.loading('Processing transaction...', { id: toastId });
        } catch (e: any) {
            toast.error(`Liquidity task failed: ${e.shortMessage || e.message}`, { id: toastId });
        }
    };

    const addLiquidity = (tokenAddress: Address, amountPREWA: string, amountOther: string) => {
        const args = [tokenAddress, parseUnits(amountPREWA, 18), parseUnits(amountOther, 18), 0n, 0n, BigInt(Math.floor(Date.now()/1000) + 600)];
        executeLiquidityTask('addLiquidity', args, 'add-liq-toast');
    };

    const addLiquidityBNB = (amountPREWA: string, amountBNB: string) => {
        const args = [parseUnits(amountPREWA, 18), 0n, 0n, BigInt(Math.floor(Date.now()/1000) + 600)];
        executeLiquidityTask('addLiquidityBNB', args, 'add-liq-bnb-toast', parseEther(amountBNB));
    };
    
    const removeLiquidity = (otherToken: Address, liquidityAmount: string) => {
        const args = [otherToken, parseUnits(liquidityAmount, 18), 0n, 0n, BigInt(Math.floor(Date.now()/1000) + 600)];
        executeLiquidityTask('removeLiquidity', args, 'remove-liq-toast');
    };
    
    const removeLiquidityBNB = (liquidityAmount: string) => {
        const args = [parseUnits(liquidityAmount, 18), 0n, 0n, BigInt(Math.floor(Date.now()/1000) + 600)];
        executeLiquidityTask('removeLiquidityBNB', args, 'remove-liq-bnb-toast');
    };

    const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({ hash });

    // CORRECTED: Use useEffect to handle side-effects
    useEffect(() => {
        if (isSuccess) {
            toast.success('Liquidity transaction confirmed!');
        }
        if (isError) {
            toast.error('Liquidity transaction failed.');
        }
    }, [isSuccess, isError]);

    return { addLiquidity, addLiquidityBNB, removeLiquidity, removeLiquidityBNB, isLoading: isPending || isConfirming };
};