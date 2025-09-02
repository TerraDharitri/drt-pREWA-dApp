// src/hooks/useSwapHistory.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useChainId, usePublicClient } from "wagmi";
import type { Address, Hash, Hex, Log } from "viem";
import {
  decodeEventLog,
  formatUnits,
  getAddress,
  hexToString,
  keccak256,
  toBytes,
} from "viem";
import { pREWAAbis } from "@/constants";

// Minimal client interface to avoid viem/wagmi cross-version type conflicts.
// Only the methods we actually use are declared here.
type MinimalPublicClient = {
  chain?: { id: number };
  readContract: (args: any) => Promise<any>;
  getLogs: (args: any) => Promise<any[]>;
  getBlockNumber: () => Promise<bigint>;
  getBlock: (args: any) => Promise<{ timestamp: bigint } & Record<string, any>>;
  getTransactionReceipt: (args: any) => Promise<any>;
};

export type SwapRow = {
  blockNumber: bigint;
  txHash: Hash;
  logIndex: number;
  type: "Swap";
  pair: Address;
  token0: Address;
  token1: Address;
  sym0: string;
  sym1: string;
  dec0: number;
  dec1: number;
  amount0In: string;
  amount1In: string;
  amount0Out: string;
  amount1Out: string;
  timestamp?: bigint;
  // UI aliases
  hash: Hash;            // = txHash
  token0Label?: string;  // sym0
  token1Label?: string;  // sym1
};

type SwapDebug = {
  pair?: Address;
  chainId?: number;
  fromBlock?: bigint;
  toBlock?: bigint;
  spans?: string;
  logsFetched?: number;
  reason?: string;
  timedOut?: boolean;
};

const ZERO = "0x0000000000000000000000000000000000000000" as const;

const FACTORY: Record<number, Address> = {
  56: "0x1097053Fd2ea711dad45caCcc45EfF7548fCB362",
  97: "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
};

const SWAP_TOPIC = keccak256(toBytes("Swap(address,uint256,uint256,uint256,uint256,address)"));

const SPANS = [5_000n, 20_000n, 40_000n, 120_000n, 240_000n] as const;
const CHUNK_TIMEOUT_MS = 7_000;

const ERC20_SYMBOL_STRING_ABI = [
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
] as const;
const ERC20_SYMBOL_BYTES32_ABI = [
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
] as const;
const ERC20_DECIMALS_ABI = [
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;

function envPair(chainId?: number): Address | undefined {
  if (!chainId) return undefined;
  const v = chainId === 97 ? process.env.NEXT_PUBLIC_SWAP_PAIR_97 : process.env.NEXT_PUBLIC_SWAP_PAIR_56;
  if (!v) return undefined;
  try { return getAddress(v) as Address; } catch { return undefined; }
}

function isZero(a?: Address): boolean {
  return !a || a.toLowerCase() === ZERO;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function readSymbol(pc: MinimalPublicClient, token: Address): Promise<string> {
  try {
    const s = await withTimeout(
      pc.readContract({ address: token, abi: ERC20_SYMBOL_STRING_ABI, functionName: "symbol" }) as Promise<string>,
      2500
    );
    if (s) return s;
  } catch {}
  try {
    const b = await withTimeout(
      pc.readContract({ address: token, abi: ERC20_SYMBOL_BYTES32_ABI, functionName: "symbol" }) as Promise<`0x${string}`>,
      2500
    );
    const decoded = hexToString(b).replace(/\u0000+$/g, "");
    if (decoded) return decoded;
  } catch {}
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

async function readDecimals(pc: MinimalPublicClient, token: Address): Promise<number> {
  try {
    const d = await withTimeout(
      pc.readContract({ address: token, abi: ERC20_DECIMALS_ABI, functionName: "decimals" }) as Promise<number>,
      2500
    );
    if (typeof d === "number") return d;
  } catch {}
  return 18;
}

async function loadPairMeta(pc: MinimalPublicClient, pair: Address) {
  const token0 = (await withTimeout(
    pc.readContract({ address: pair, abi: pREWAAbis.TypedIPancakePair, functionName: "token0" }) as Promise<Address>,
    2500
  )) as Address;
  const token1 = (await withTimeout(
    pc.readContract({ address: pair, abi: pREWAAbis.TypedIPancakePair, functionName: "token1" }) as Promise<Address>,
    2500
  )) as Address;

  const [sym0, sym1, dec0, dec1] = await Promise.all([
    readSymbol(pc, token0),
    readSymbol(pc, token1),
    readDecimals(pc, token0),
    readDecimals(pc, token1),
  ]);

  return { token0, token1, sym0, sym1, dec0, dec1 };
}

async function scanSwapsBackwards(
  pc: MinimalPublicClient,
  pair: Address,
  fromBlock: bigint,
  toBlock: bigint,
  deadline: number,
  meta: { token0: Address; token1: Address; sym0: string; sym1: string; dec0: number; dec1: number }
): Promise<SwapRow[]> {
  const out: SwapRow[] = [];
  let STEP = 50_000n;

  for (let end = toBlock; Date.now() < deadline && end >= fromBlock; ) {
    let start = end >= (STEP - 1n) ? end - (STEP - 1n) : fromBlock;
    if (start < fromBlock) start = fromBlock;

    for (;;) {
      try {
        const raw = (await withTimeout(
          pc.getLogs({ address: pair, fromBlock: start, toBlock: end }) as Promise<Log[]>,
          CHUNK_TIMEOUT_MS
        )) as Log[];

        for (const l of raw) {
          if (!l.topics || l.topics.length === 0) continue;
          if (l.topics[0] !== SWAP_TOPIC) continue;

          const ev = decodeEventLog({
            abi: pREWAAbis.TypedIPancakePair,
            data: l.data as Hex,
            topics: [l.topics![0] as Hex, ...(l.topics!.slice(1) as Hex[])] as [`0x${string}`, ...`0x${string}`[]],
         });

          const [, amount0In, amount1In, amount0Out, amount1Out] = ev.args as any[];

          const row: SwapRow = {
            blockNumber: l.blockNumber!,
            txHash: l.transactionHash!,
            logIndex: Number(l.logIndex!),
            type: "Swap",
            pair,
            token0: meta.token0,
            token1: meta.token1,
            sym0: meta.sym0,
            sym1: meta.sym1,
            dec0: meta.dec0,
            dec1: meta.dec1,
            amount0In: amount0In ? formatUnits(amount0In, meta.dec0) : "0",
            amount1In: amount1In ? formatUnits(amount1In, meta.dec1) : "0",
            amount0Out: amount0Out ? formatUnits(amount0Out, meta.dec0) : "0",
            amount1Out: amount1Out ? formatUnits(amount1Out, meta.dec1) : "0",
            // aliases for UI
            hash: l.transactionHash!,
            token0Label: meta.sym0,
            token1Label: meta.sym1,
          };

          out.push(row);
        }

        break; // range succeeded
      } catch (err) {
        STEP = STEP > 10_000n ? STEP / 2n : 5_000n;
        if (Date.now() >= deadline) break;
        continue;
      }
    }

    if (end <= fromBlock) break;
    end = start > fromBlock ? start - 1n : fromBlock;
  }

  return out;
}

async function fetchSwaps(
  pc: MinimalPublicClient | undefined,
  chainId: number,
  pair: Address | undefined          // ← accept undefined to satisfy the hook call-site
): Promise<{ rows: SwapRow[]; debug: SwapDebug }> {
  const debug: SwapDebug = { pair, chainId, spans: "" };

  if (!pc) return { rows: [], debug: { ...debug, reason: "no publicClient" } };

  // Resolve pair if not provided
  if (!pair || isZero(pair)) {
    const env = envPair(chainId);
    if (!env) return { rows: [], debug: { ...debug, reason: "no pair" } };
    pair = env;
  }

  const meta = await loadPairMeta(pc, pair);
  const latest = await withTimeout(pc.getBlockNumber(), 3000);

  const blockTs = async (n: bigint): Promise<bigint> => {
    const b = await withTimeout(pc.getBlock({ blockNumber: n }), 2500);
    return b.timestamp as bigint;
  };

  const rows: SwapRow[] = [];
  const deadline = Date.now() + 8_000;

  for (const span of SPANS) {
    if (Date.now() >= deadline) break;
    const from = latest > span ? latest - span : 1n;
    debug.fromBlock = from;
    debug.toBlock = latest;
    debug.spans += `${span.toString()}(S-) `;

    const chunk = await scanSwapsBackwards(pc, pair, from, latest, deadline, meta);
    for (const r of chunk) {
      r.timestamp = await blockTs(r.blockNumber);
      rows.push(r);
    }
    if (chunk.length > 0) break;
  }

  rows.sort((a, b) =>
    a.blockNumber === b.blockNumber ? 0 : a.blockNumber > b.blockNumber ? -1 : 1
  );

  debug.logsFetched = rows.length;
  debug.timedOut = Date.now() >= deadline;

  return { rows, debug };
}

export function useSwapHistory(inputPair?: Address) {
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const pair = inputPair ?? envPair(chainId);

  // If there is no pair at all, return an empty dataset but keep the hook typed.
  const empty = useQuery({
    queryKey: ["swapHistory", chainId, pair],
    queryFn: async () => ({ rows: [] as SwapRow[], debug: { pair, chainId } as SwapDebug }),
    enabled: !pair || !chainId || !publicClient,
    refetchInterval: false as any,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const query = useQuery({
    queryKey: ["swapHistory", chainId, pair],
    queryFn: () =>
      fetchSwaps(
        publicClient as unknown as MinimalPublicClient,
        chainId!,
        pair // now allowed as Address | undefined
      ),
    enabled: !!publicClient && !!chainId && !!pair,
    refetchInterval: 60_000,
    retry: false,
  });

  const rows  = (query.data as any)?.rows ?? (empty.data as any)?.rows ?? [];
  const debug = (query.data as any)?.debug ?? (empty.data as any)?.debug ?? ({ pair, chainId } as SwapDebug);
  return { ...query, data: rows as SwapRow[], debug, pair, chainId };
}
