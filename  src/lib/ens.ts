// src/lib/ens.ts
import type { Address, PublicClient } from "viem";

// Only enable ENS on chains that actually support it.
const ENS_CHAINS = new Set<number>([1, 5, 11155111]); // mainnet, goerli, sepolia

/**
 * Tries to resolve an ENS name for an address.
 * Returns null if the chain doesn’t support ENS or the lookup fails.
 */
export async function tryEnsName(
  client: PublicClient | undefined,
  address: Address,
  chainId?: number
): Promise<string | null> {
  if (!client || !chainId || !ENS_CHAINS.has(chainId)) return null;
  try {
    const name = await client.getEnsName({ address });
    return name ?? null;
  } catch {
    return null;
  }
}
