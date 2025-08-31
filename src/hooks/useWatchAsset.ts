"use client";

import { watchAsset as wagmiWatchAsset } from "@wagmi/core";
import { config as wagmiConfig } from "@/config/wagmi";
import type { Address } from "viem";
import toast from "react-hot-toast";

export const useWatchAsset = () => {
  // Raw EIP-747 call through Wagmi Core
  const watchAsset = async (
    address: Address,
    symbol: string = "TOKEN",
    decimals: number = 18,
    image?: string
  ): Promise<boolean> => {
    try {
      const ok = await wagmiWatchAsset(wagmiConfig, {
        type: "ERC20",
        options: { address, symbol, decimals, image },
      });
      return ok;
    } catch (e) {
      console.error("watchAsset failed:", e);
      return false;
    }
  };

  // UI wrapper with toasts
  const addTokenToWallet = async (
    address: Address,
    symbol: string,
    decimals: number = 18,
    image?: string
  ) => {
    const ok = await watchAsset(address, symbol, decimals, image);
    if (ok) toast.success(`${symbol} added to wallet`);
    else console.log(`User dismissed adding ${symbol}`);
    return ok;
  };

  return { watchAsset, addTokenToWallet };
};