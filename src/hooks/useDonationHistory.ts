// src/hooks/useDonationHistory.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import type { Address, Hex } from "viem";
import type { Abi } from "abitype";
import { pREWAContracts } from "@/contracts/addresses";
import { DonationAbi } from "@/contracts/abis/Donation";

/**
 * donations(tokenId) returns 7 fields:
 * [ donor, token, amount, timestamp, verificationHash, decimals, symbol ]
 */

export type DonationRow = {
  tokenId: bigint;
  donor: Address;
  token: Address;
  amount: bigint;
  timestamp: number;
  verificationHash: Hex;
  decimals: number;
  symbol: string;
};

type PC = ReturnType<typeof usePublicClient>;

/** Read a single mapping slot and return the raw 7-tuple (or undefined if call fails). */
async function readDonationTuple(pc: PC, address: Address, id: bigint) {
  try {
    const res = await pc!.readContract({
      address,
      abi: DonationAbi as unknown as Abi,
      functionName: "donations",
      args: [id],
    });
    return res as unknown as [
      Address,                               // donor
      Address,                               // token
      bigint | string | number,              // amount
      bigint | string | number,              // timestamp
      Hex,                                   // verificationHash
      number | bigint | string,              // decimals
      string                                 // symbol
    ];
  } catch {
    return undefined;
  }
}

/** Returns true if donations(id).timestamp > 0 */
async function existsDonation(pc: PC, address: Address, id: bigint) {
  const tup = await readDonationTuple(pc, address, id);
  if (!tup) return false;
  const ts = Number(tup[3] as any);
  return ts > 0;
}

/**
 * Discover the max tokenId by probing storage (no events, no counters).
 * Strategy: exponential growth until first empty slot, then binary search.
 */
async function findMaxTokenIdByProbe(pc: PC, address: Address): Promise<bigint> {
  // If #1 doesn't exist, there are no donations.
  if (!(await existsDonation(pc, address, 1n))) return 0n;

  let lo = 1n;
  let hi = 2n;

  // Exponential phase
  while (await existsDonation(pc, address, hi)) {
    lo = hi;
    hi = hi * 2n;
    // Hard cap to avoid infinite loops on weird contracts (supports > 2^20 donations)
    if (hi > (1n << 20n)) break;
  }

  // Binary search: find last id with timestamp > 0
  while (lo + 1n < hi) {
    const mid = (lo + hi) >> 1n;
    if (await existsDonation(pc, address, mid)) lo = mid;
    else hi = mid;
  }

  return lo;
}

/** Batch read donations for a numeric range (inclusive). */
async function readRange(pc: PC, address: Address, start: bigint, end: bigint) {
  const rows: DonationRow[] = [];
  if (end < start) return rows;

  // chunk multicalls to be nice to RPC
  const CHUNK = 200n;
  for (let s = start; s <= end; s += CHUNK) {
    const e = s + CHUNK - 1n <= end ? s + CHUNK - 1n : end;

    const contracts = [];
    for (let id = s; id <= e; id++) {
      contracts.push({
        address,
        abi: DonationAbi as unknown as Abi,
        functionName: "donations",
        args: [id],
      });
    }

    const res: Array<{ status: "success" | "failure"; result?: unknown }> = await pc!.multicall({
      allowFailure: true,
      contracts,
    });

    let id = s;
    for (const r of res) {
      if (r?.status === "success" && Array.isArray(r.result)) {
        const tup = r.result as unknown as [
          Address,
          Address,
          bigint | string | number,
          bigint | string | number,
          Hex,
          number | bigint | string,
          string
        ];
        const ts = Number(tup[3] as any);
        if (ts > 0) {
          rows.push({
            tokenId: id,
            donor: tup[0] as Address,
            token: tup[1] as Address,
            amount: typeof tup[2] === "bigint" ? (tup[2] as bigint) : BigInt(tup[2] as any),
            timestamp: ts,
            verificationHash: tup[4] as Hex,
            decimals: typeof tup[5] === "number" ? (tup[5] as number) : Number(tup[5] as any),
            symbol: (tup[6] as string) || "TOKEN",
          });
        }
      }
      id += 1n;
    }
  }

  rows.sort((a, b) => b.timestamp - a.timestamp);
  return rows;
}

async function fetchHistory(pc: PC, address: Address): Promise<DonationRow[]> {
  const maxId = await findMaxTokenIdByProbe(pc, address);
  if (maxId === 0n) return [];
  return readRange(pc, address, 1n, maxId);
}

/**
 * Public hook
 *  - overrideAddress: explicitly query this address (useful if your form shows a proxy)
 */
export function useDonationHistory(overrideAddress?: Address) {
  const chainId = useChainId();
  const pc = usePublicClient({ chainId });
  const { address: me } = useAccount();

  const contract: Address | undefined =
    overrideAddress ??
    (chainId ? ((pREWAContracts as any)[chainId]?.Donation as Address | undefined) : undefined);

  const query = useQuery<DonationRow[]>({
    queryKey: ["donationHistory:storageProbe", chainId, contract],
    enabled: Boolean(pc && contract),
    refetchInterval: 60_000,
    queryFn: async () => (!pc || !contract ? [] : fetchHistory(pc, contract)),
  });

  const all = query.data ?? [];
  const mine = me ? all.filter((r) => r.donor.toLowerCase() === me.toLowerCase()) : [];

  return { ...query, all, mine, donation: contract, chainId };
}
