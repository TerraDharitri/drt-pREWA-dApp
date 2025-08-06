// src/hooks/useSwap.ts

"use client";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { Address, parseUnits, BaseError } from "viem";
import toast from "react-hot-toast";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const WETH_ADDRESS_TESTNET = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"; // WBNB on BSC Testnet

export const useSwap = () => {
    const { address, chainId } = useAccount();
    const queryClient = useQueryClient();
    const toastIdRef = useRef<string | undefined>();

    const routerAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.PancakeRouter : undefined;
    const pREWAAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.pREWAToken : undefined;

    const { data: hash, writeContractAsync, isPending, error: writeError, reset } = useWriteContract();

    const swap = async (
        fromToken: { address: Address; decimals: number },
        toToken: { address: Address; decimals: number },
        fromAmount: string,
        toAmount: string,
        slippageBps = 50 // 0.5% default
    ) => {
        if (!routerAddress || !pREWAAddress || !address) return toast.error("Required contract addresses not found.");
        
        const amountIn = parseUnits(fromAmount, fromToken.decimals);
        const amountOut = parseUnits(toAmount, toToken.decimals);
        const amountOutMin = amountOut - (amountOut * BigInt(slippageBps) / 10000n);
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10); // 10 minutes

        const isNativeIn = fromToken.address.toLowerCase() === WETH_ADDRESS_TESTNET.toLowerCase();
        const isNativeOut = toToken.address.toLowerCase() === WETH_ADDRESS_TESTNET.toLowerCase();

        let txDetails: any = {
            address: routerAddress,
            abi: pREWAAbis.IPancakeRouter,
        };

        if (isNativeIn) {
            txDetails.functionName = 'swapExactETHForTokens';
            txDetails.args = [amountOutMin, [fromToken.address, toToken.address], address, deadline];
            txDetails.value = amountIn;
        } else if (isNativeOut) {
            txDetails.functionName = 'swapExactTokensForETH';
            txDetails.args = [amountIn, amountOutMin, [fromToken.address, toToken.address], address, deadline];
        } else {
            txDetails.functionName = 'swapExactTokensForTokens';
            txDetails.args = [amountIn, amountOutMin, [fromToken.address, toToken.address], address, deadline];
        }

        toastIdRef.current = toast.loading("Waiting for swap signature...");
        
        try {
            await writeContractAsync(txDetails);
        } catch (e: any) {
            const errorMsg = e instanceof BaseError ? e.shortMessage : (e.message || "Transaction rejected.");
            toast.error(errorMsg, { id: toastIdRef.current });
            toastIdRef.current = undefined;
        }
    };

    const { isLoading: isConfirming, isSuccess, isError, error: receiptError } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        const toastId = toastIdRef.current;
        if (!hash || !toastId) return;

        if (isConfirming) {
            toast.loading("Processing swap...", { id: toastId });
        } else if (isSuccess) {
            toast.success("Swap successful!", { id: toastId });
            queryClient.invalidateQueries();
            reset();
            toastIdRef.current = undefined;
        } else if (isError) {
            const error = receiptError || writeError;
            const errorMsg = error instanceof BaseError ? error.shortMessage : (error?.message || "Swap failed.");
            toast.error(errorMsg, { id: toastId });
            reset();
            toastIdRef.current = undefined;
        }
    }, [isConfirming, isSuccess, isError, hash, receiptError, writeError, reset, queryClient]);

    return { 
        swap, 
        isLoading: isPending || isConfirming 
    };
};