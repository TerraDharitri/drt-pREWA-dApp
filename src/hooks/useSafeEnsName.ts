// src/hooks/useSafeEnsName.ts
"use client";

import { useEffect, useState } from "react";

/**
 * Safe ENS name resolver (defensive)
 * - Never calls ENS on non-ENS chains (e.g., BSC 56, BSC Testnet 97)
 * - Returns an object to match callers: { ensName, isLoading }
 * - If you later want real ENS on mainnet, add the resolution where indicated
 */
export function useSafeEnsName(
  address?: `0x${string}` | string,
  chainId?: number
) {
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setEnsName(null);
      return;
    }

    // If we have a chainId and it's not mainnet (1), skip ENS entirely.
    // Using Number(chainId) avoids TS complaints when chainId's type is a literal union (e.g., 56 | 97).
    if (typeof chainId === "number" && Number(chainId) !== 1) {
      setEnsName(null);
      return;
    }

    // If you want to actually resolve ENS on mainnet later,
    // do it here with your viem/ethers client and remember to set isLoading accordingly.
    // Example scaffold:
    //
    // setIsLoading(true);
    // resolveEnsOnMainnet(address)
    //   .then((name) => setEnsName(name ?? null))
    //   .catch(() => setEnsName(null))
    //   .finally(() => setIsLoading(false));

    // For now, avoid any reverse lookup — just return null.
    setEnsName(null);
  }, [address, chainId]);

  return { ensName, isLoading };
}
