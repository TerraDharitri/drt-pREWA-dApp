"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { readContract } from "@wagmi/core";
import { config as wagmiConfig } from "@/config/wagmi";
import type { Abi, Address, Hex } from "viem";
import { BaseError, parseUnits } from "viem";
import toast from "react-hot-toast";

import { pREWAAbis, pREWAAddresses } from "@/constants";
import { TOKEN_LISTS } from "@/constants/tokens";
import { safeFind } from "@/utils/safe";

// ------ config --------------------------------------------------------------

const SLIPPAGE_BPS = 50n; // 0.50%
const DEADLINE_SECS = 60 * 20;

// Minimal ABI for ERC20 functions we need
const erc20Abi = [
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
] as const;

// ------ helpers -------------------------------------------------------------

const deadline = () => BigInt(Math.floor(Date.now() / 1000) + DEADLINE_SECS);

function fnInputs(abi: Abi, name: string): number {
  const entry = (abi as any[]).find((i) => i?.type === "function" && i?.name === name);
  return entry?.inputs?.length ?? 0;
}

type LpTokenInfo = { address: Address; symbol: string; decimals: number; balance: bigint };
type UseLiquidityOpts = {
  onAddSuccess?: (lpToken: LpTokenInfo) => void;
  onRemoveSuccess?: () => void;
};

type ActionType = "add" | "remove";

export const useLiquidity = (opts: UseLiquidityOpts = {}) => {
  const { address, chainId } = useAccount();

  const {
    writeContractAsync,
    reset: resetWriteContract,
  } = useWriteContract();

  const [txHash, setTxHash] = useState<Hex | undefined>();
  const [isRequesting, setIsRequesting] = useState(false);
  const [lastActionType, setLastActionType] = useState<ActionType | null>(null);
  const transactionToastIdRef = useRef<string | undefined>();

  const lmAddress = useMemo(() => {
    if (!chainId) return undefined;
    return pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LiquidityManager as Address | undefined;
  }, [chainId]);

  const prewaAddress = useMemo(() => {
    if (!chainId) return undefined;
    return pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.pREWAToken as Address | undefined;
  }, [chainId]);

  const lmAbi = pREWAAbis.LiquidityManager as Abi;

  const tokens = useMemo(
    () => (chainId ? TOKEN_LISTS[chainId as keyof typeof TOKEN_LISTS] || [] : []),
    [chainId]
  );
  const decimalsOf = (addr: Address) =>
    tokens.find((t) => t.address.toLowerCase() === addr.toLowerCase())?.decimals ?? 18;

  const lastOtherTokenRef = useRef<Address | undefined>(undefined);

  const { refetch: refetchLP } = useReadContract({
    address: lmAddress,
    abi: lmAbi,
    functionName: "getLPTokenAddress",
    args: [lastOtherTokenRef.current as Address],
    query: { enabled: false },
  });

  const askWallet = async (
    cfg: { address: Address; abi: Abi; functionName: string; args?: readonly unknown[]; value?: bigint; },
    loading: string,
    actionType: ActionType
  ) => {
    if (transactionToastIdRef.current) toast.dismiss(transactionToastIdRef.current);
    
    const id = toast.loading(loading);
    transactionToastIdRef.current = id;
    
    try {
      setIsRequesting(true);
      setLastActionType(actionType);
      const hash = await writeContractAsync(cfg);
      setTxHash(hash);
      toast.loading("Waiting for confirmation…", { id });
    } catch (err: any) {
      let msg = "Transaction request failed.";
      if (err?.code === 4001 || err?.name === "UserRejectedRequestError") msg = "Request rejected in wallet.";
      else if (err instanceof BaseError && err.shortMessage) msg = err.shortMessage;
      else if (err?.message) msg = err.message;

      toast.error(msg, { id });
      resetWriteContract();
      setIsRequesting(false);
      setLastActionType(null);
      transactionToastIdRef.current = undefined;
    }
  };

  // Public action functions (addLiquidity, etc.) remain unchanged.
  const addLiquidity = async (tokenA: Address, tokenB: Address, amountA: string, amountB: string) => { if (!address || !lmAddress) { toast.error("Connect your wallet."); return; } const n = fnInputs(lmAbi, "addLiquidity"); 
  const aDesired = parseUnits(amountA, decimalsOf(tokenA)); 
  const bDesired = parseUnits(amountB, decimalsOf(tokenB)); 
  const aMin = aDesired - (aDesired * SLIPPAGE_BPS) / 10000n; 
  const bMin = bDesired - (bDesired * SLIPPAGE_BPS) / 10000n; if (prewaAddress) { const aIsPrewa = tokenA.toLowerCase() === prewaAddress.toLowerCase(); 
  lastOtherTokenRef.current = (aIsPrewa ? tokenB : tokenA) as Address; } if (n === 8) { await askWallet({ address: lmAddress, abi: lmAbi, functionName: "addLiquidity", args: [tokenA, tokenB, aDesired, bDesired, aMin, bMin, address, deadline()] }, "Requesting signature to add liquidity…", "add"); return; } if (n === 6) { if (!prewaAddress) { toast.error("pREWA address missing for 6-arg addLiquidity."); return; } 
  const aIsPrewa = tokenA.toLowerCase() === prewaAddress.toLowerCase(); 
  const otherToken = (aIsPrewa ? tokenB : tokenA) as Address; const prewaAmount = aIsPrewa ? aDesired : bDesired; 
  const otherAmount = aIsPrewa ? bDesired : aDesired; const prewaMin = aIsPrewa ? aMin : bMin; const otherMin = aIsPrewa ? bMin : aMin; 
  lastOtherTokenRef.current = otherToken; await askWallet({ address: lmAddress, abi: lmAbi, functionName: "addLiquidity", args: [otherToken, prewaAmount, otherAmount, prewaMin, otherMin, deadline()] }, "Requesting signature to add liquidity…", "add"); return; } toast.error(`Unsupported addLiquidity ABI (inputs=${n}).`); };
  const addLiquidityBNB = async (otherToken: Address, amountToken: string, amountBNB: string) => { if (!address || !lmAddress) { toast.error("Connect your wallet."); return; } lastOtherTokenRef.current = otherToken; 
  const tokenDesired = parseUnits(amountToken, decimalsOf(otherToken)); 
  const tokenMin = tokenDesired - (tokenDesired * SLIPPAGE_BPS) / 10000n; 
  const bnbDesired = parseUnits(amountBNB, 18); 
  const bnbMin = bnbDesired - (bnbDesired * SLIPPAGE_BPS) / 10000n; 
  const n = fnInputs(lmAbi, "addLiquidityBNB"); if (n === 6) { await askWallet({ address: lmAddress, abi: lmAbi, functionName: "addLiquidityBNB", args: [otherToken, tokenDesired, tokenMin, bnbMin, address, deadline()], value: bnbDesired }, "Requesting signature to add liquidity…", "add"); return; } if (n === 5) { await askWallet({ address: lmAddress, abi: lmAbi, functionName: "addLiquidityBNB", args: [otherToken, tokenDesired, tokenMin, bnbMin, deadline()], value: bnbDesired }, "Requesting signature to add liquidity…", "add"); return; } toast.error(`Unsupported addLiquidityBNB ABI (inputs=${n}).`); };
  const removeLiquidity = async (otherToken: Address, lpAmount: string) => { if (!address || !lmAddress) { toast.error("Connect your wallet."); return; } lastOtherTokenRef.current = otherToken; const n = fnInputs(lmAbi, "removeLiquidity"); const lp = parseUnits(lpAmount, 18); if (n === 6) { await askWallet({ address: lmAddress, abi: lmAbi, functionName: "removeLiquidity", args: [otherToken, lp, 1n, 1n, address, deadline()] }, "Requesting signature to remove liquidity…", "remove"); return; } if (n === 5) { await askWallet({ address: lmAddress, abi: lmAbi, functionName: "removeLiquidity", args: [otherToken, lp, 1n, 1n, deadline()] }, "Requesting signature to remove liquidity…", "remove"); return; } toast.error(`Unsupported removeLiquidity ABI (inputs=${n}).`); };
  const removeLiquidityBNB = async (lpAmount: string) => { if (!address || !lmAddress) { toast.error("Connect your wallet."); return; } const n = fnInputs(lmAbi, "removeLiquidityBNB"); const lp = parseUnits(lpAmount, 18); if (n === 5) { await askWallet({ address: lmAddress, abi: lmAbi, functionName: "removeLiquidityBNB", args: [lp, 1n, 1n, address, deadline()] }, "Requesting signature to remove liquidity…", "remove"); return; } if (n === 4) { await askWallet({ address: lmAddress, abi: lmAbi, functionName: "removeLiquidityBNB", args: [lp, 1n, 1n, deadline()] }, "Requesting signature to remove liquidity…", "remove"); return; } toast.error(`Unsupported removeLiquidityBNB ABI (inputs=${n}).`); };

  const {
    isLoading: isConfirming,
    isSuccess,
    isError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!txHash || isConfirming) return;
    const currentToastId = transactionToastIdRef.current;
    if (isSuccess) {
      toast.success("Transaction confirmed ✅", { id: currentToastId });
      setIsRequesting(false);
      if (lastActionType === "add") {
        (async () => {
          try {
            if (lmAddress && lastOtherTokenRef.current && address) {
              const res = await refetchLP();
              const lpAddr = (res.data || undefined) as Address | undefined;
              if (lpAddr) {
                // Fetch symbol, decimals, AND the user's new balance
                const [fetchedSymbol, fetchedDecimals, fetchedBalance] = await Promise.all([
                  readContract(wagmiConfig, { abi: erc20Abi, address: lpAddr, functionName: 'symbol' }),
                  readContract(wagmiConfig, { abi: erc20Abi, address: lpAddr, functionName: 'decimals' }),
                  readContract(wagmiConfig, { abi: erc20Abi, address: lpAddr, functionName: 'balanceOf', args: [address] }),
                ]);
                
                // Pass all the info back to the component via the callback
                opts.onAddSuccess?.({
                  address: lpAddr,
                  symbol: fetchedSymbol as string,
                  decimals: fetchedDecimals as number,
                  balance: fetchedBalance as bigint,
                });
              }
            }
          } catch (e) { console.warn("Failed to discover LP token details:", e); }
        })();
      }
      if (lastActionType === "remove") opts.onRemoveSuccess?.();
    }
    if (isError) {
      let msg = "Transaction failed.";
      const err = receiptError as BaseError | Error | undefined;
      if (err instanceof BaseError && err.shortMessage) msg = err.shortMessage;
      else if (err?.message) msg = err.message;
      toast.error(msg, { id: currentToastId });
      setIsRequesting(false);
    }
    resetWriteContract();
    setTxHash(undefined);
    setLastActionType(null);
    transactionToastIdRef.current = undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txHash, isConfirming, isSuccess, isError, receiptError]);

  return { addLiquidity, addLiquidityBNB, removeLiquidity, removeLiquidityBNB, isLoading: isRequesting || isConfirming };
};