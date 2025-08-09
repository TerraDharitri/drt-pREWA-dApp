"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import type { Address } from "viem";
import { pREWAAddresses } from "@/constants";

function rpcUrlFor(chainId: number | undefined) {
  if (!chainId) return undefined;
  if (chainId === 56) return process.env.NEXT_PUBLIC_BSC_RPC_URL;
  if (chainId === 97) return process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL;
  return undefined;
}

// minimal Safe proxy ABI
const SAFE_ABI = ["function getOwners() view returns (address[])"];

/** Pure RPC owner check. No Safe SDK. No wallet provider. */
export function useIsSafeOwner(passedSafe?: Address) {
  const { address, chainId } = useAccount();
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const safeAddress = useMemo(() => {
    if (passedSafe) return passedSafe;
    if (!chainId) return undefined;
    return pREWAAddresses[chainId as keyof typeof pREWAAddresses]
      ?.ProtocolAdminSafe as Address | undefined;
  }, [passedSafe, chainId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (!safeAddress || !chainId || !address) {
          setIsOwner(false);
          return;
        }
        const rpc = rpcUrlFor(chainId);
        if (!rpc) throw new Error("Missing RPC URL for this network");
        const provider = new ethers.JsonRpcProvider(rpc, chainId);
        const safe = new ethers.Contract(safeAddress, SAFE_ABI, provider);
        const owners: string[] = await safe.getOwners();
        const match = owners.some((o) => o.toLowerCase() === address.toLowerCase());
        if (!cancelled) setIsOwner(match);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? String(e));
        if (!cancelled) setIsOwner(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [safeAddress, chainId, address]);

  return { isOwner, isLoading, error, safeAddress };
}
