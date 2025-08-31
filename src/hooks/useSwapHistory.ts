// src/hooks/useSwapHistory.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useChainId, usePublicClient } from "wagmi";
import type { Address, Hash, Hex, Log, PublicClient } from "viem";
import {
  decodeEventLog,
  formatUnits,
  getAddress,
  hexToString,
  keccak256,
  toBytes,
} from "viem";
import { pREWAAbis } from "@/constants";

/* ======================= Types ======================= */

export type SwapRow = {
  hash: Hash;
  trader: Address;
  amountIn: string;
  amountOut: string;
  tokenIn: string;
  tokenOut: string;
  blockNumber: bigint;
  timestamp: number;
  to: Address;
};

export type SwapDebug = {
  chainId?: number;
  pair?: Address;
  latestBlock?: bigint;
  fromBlock?: bigint;
  toBlock?: bigint;
  logsFetched?: number;
  spans?: string;
  strategy?: "address+topic" | "event";
  fallbackPair?: Address;
  timedOut?: boolean;
  reason?: string;
};

type PairMeta = {
  token0: Address;
  token1: Address;
  sym0: string;
  sym1: string;
  dec0: number;
  dec1: number;
};

/* ======================= Config ======================= */

const ZERO = "0x0000000000000000000000000000000000000000" as Address;
const isZero = (a?: Address) => !a || getAddress(a) === getAddress(ZERO);

// V2 Swap topic0
const SWAP_TOPIC: Hex = keccak256(
  toBytes("Swap(address,uint256,uint256,uint256,uint256,address)")
);

// Scan windows — now we scan **backwards** (latest first)
const SPANS: bigint[] = [2_000_000n, 1_000_000n, 500_000n, 250_000n, 100_000n];

// Timeouts
const CHUNK_TIMEOUT_MS = 4000;   // per getLogs slice
const TOTAL_BUDGET_MS = 20000;   // overall budget

// PancakeV2 factories
const FACTORY: Record<number, Address> = {
  56: "0xCA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
  97: "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
} as const;

// Known USDTs (defaults if no env)
const KNOWN_USDT: Record<number, Address> = {
  56: "0x55d398326f99059fF775485246999027B3197955",
  97: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
} as const;

// Minimal ERC-20 ABIs
const ERC20_SYMBOL_STRING_ABI = [
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
] as const;
const ERC20_SYMBOL_BYTES32_ABI = [
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
] as const;
const ERC20_DECIMALS_ABI = [
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;

/* ======================= Envs ======================= */

function envPair(chainId?: number): Address | undefined {
  if (!chainId) return undefined;
  const v =
    chainId === 97
      ? process.env.NEXT_PUBLIC_SWAP_PAIR_97
      : chainId === 56
      ? process.env.NEXT_PUBLIC_SWAP_PAIR_56
      : undefined;
  if (!v) return undefined;
  try { return getAddress(v) as Address; } catch { return undefined; }
}

function envToken(chainId: number, which: "PREWA" | "USDT"): Address | undefined {
  const v =
    which === "PREWA"
      ? (chainId === 56 ? process.env.NEXT_PUBLIC_PREWA_56 : process.env.NEXT_PUBLIC_PREWA_97)
      : (chainId === 56 ? process.env.NEXT_PUBLIC_USDT_56 : process.env.NEXT_PUBLIC_USDT_97);
  if (!v) return undefined;
  try { return getAddress(v) as Address; } catch { return undefined; }
}

/* ======================= Utils ======================= */

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

async function readSymbol(pc: PublicClient, token: Address): Promise<string> {
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

async function readDecimals(pc: PublicClient, token: Address): Promise<number> {
  try {
    const d = await withTimeout(
      pc.readContract({ address: token, abi: ERC20_DECIMALS_ABI, functionName: "decimals" }) as Promise<number>,
      2500
    );
    if (d > 0 && d <= 36) return d;
  } catch {}
  return 18;
}

async function loadPairMeta(pc: PublicClient, pair: Address): Promise<PairMeta> {
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

async function resolvePairFromFactory(
  pc: PublicClient,
  chainId: number
): Promise<Address | undefined> {
  const factory = FACTORY[chainId];
  if (!factory) return undefined;

  const prewa = envToken(chainId, "PREWA");
  const usdt  = envToken(chainId, "USDT") ?? KNOWN_USDT[chainId];
  if (!prewa || !usdt) return undefined;

  try {
    const addr = (await withTimeout(
      pc.readContract({
        address: factory,
        abi: [
          {
            name: "getPair",
            type: "function",
            stateMutability: "view",
            inputs: [{ type: "address" }, { type: "address" }],
            outputs: [{ type: "address" }],
          },
        ] as const,
        functionName: "getPair",
        args: [prewa, usdt],
      }) as Promise<Address>,
      2500
    )) as Address;

    const normalized = getAddress(addr) as Address;
    return isZero(normalized) ? undefined : normalized;
  } catch {
    return undefined;
  }
}

/* ================== Log collection (BACKWARDS) =================== */

// Address-only scan → filter topic0 → local decode (scan backwards)
async function getLogs_AddressOnly_Backwards(
  pc: PublicClient,
  pair: Address,
  fromBlock: bigint,
  toBlock: bigint,
  deadline: number
) {
  const all: any[] = [];
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

        const filtered = raw.filter((l) => l.topics && l.topics[0] === SWAP_TOPIC);

        const decoded = filtered.map((l) => {
          try {
            const topicsTuple = [SWAP_TOPIC, ...((l.topics?.slice(1) ?? []) as Hex[])] as [Hex, ...Hex[]];
            const ev = decodeEventLog({
              abi: [pREWAAbis.SwapEvent] as const,
              data: l.data as Hex,
              topics: topicsTuple,
              strict: false,
            });
            return { ...l, args: (ev as any).args };
          } catch {
            return { ...l, args: {} };
          }
        });

        all.push(...decoded);
        break;
      } catch {
        if (STEP <= 5_000n) break;  // give up on this slice
        STEP = STEP / 2n;           // shrink and retry same end
        start = end >= (STEP - 1n) ? end - (STEP - 1n) : fromBlock;
        if (start < fromBlock) start = fromBlock;
      }
    }

    // move window backwards
    if (start === fromBlock) break;
    end = start - 1n;
  }

  return all;
}

// ABI-filtered scan (backwards)
async function getLogs_Event_Backwards(
  pc: PublicClient,
  pair: Address,
  fromBlock: bigint,
  toBlock: bigint,
  deadline: number
) {
  const all: any[] = [];
  let STEP = 50_000n;

  for (let end = toBlock; Date.now() < deadline && end >= fromBlock; ) {
    let start = end >= (STEP - 1n) ? end - (STEP - 1n) : fromBlock;
    if (start < fromBlock) start = fromBlock;

    for (;;) {
      try {
        const chunk = await withTimeout(
          pc.getLogs({ address: pair, event: pREWAAbis.SwapEvent, fromBlock: start, toBlock: end }),
          CHUNK_TIMEOUT_MS
        );
        all.push(...chunk);
        break;
      } catch {
        if (STEP <= 5_000n) break;
        STEP = STEP / 2n;
        start = end >= (STEP - 1n) ? end - (STEP - 1n) : fromBlock;
        if (start < fromBlock) start = fromBlock;
      }
    }

    if (start === fromBlock) break;
    end = start - 1n;
  }

  return all;
}

/* ======================= Fetch ======================= */

const fetchSwaps = async (
  pc: PublicClient | null,
  chainId: number,
  initialPair?: Address
): Promise<{ rows: SwapRow[]; debug: SwapDebug }> => {
  const debug: SwapDebug = { chainId, pair: initialPair, spans: "" };

  if (!pc || !initialPair || isZero(initialPair)) {
    return { rows: [], debug: { ...debug, reason: "no pair/publicClient" } };
  }

  const deadline = Date.now() + TOTAL_BUDGET_MS;

  // Load meta (symbols/decimals) from *initial* pair
  const meta = await loadPairMeta(pc, initialPair);

  const latest = await withTimeout(pc.getBlockNumber(), 3000);
  debug.latestBlock = latest;

  let logs: any[] = [];
  let strategy: SwapDebug["strategy"] = "address+topic";

  // Try wide→narrow, but **backwards** (most recent first)
  for (const span of SPANS) {
    if (Date.now() >= deadline) break;
    const from = latest > span ? latest - span : 1n;
    debug.fromBlock = from;
    debug.toBlock = latest;
    debug.spans += `${span.toString()}(A-) `;
    const chunk = await getLogs_AddressOnly_Backwards(pc, initialPair, from, latest, deadline);
    if (chunk.length > 0) { logs = chunk; break; }
  }

  // Fallback to ABI-filtered (still backwards)
  if (logs.length === 0 && Date.now() < deadline) {
    strategy = "event";
    debug.spans += "| ";
    for (const span of SPANS) {
      if (Date.now() >= deadline) break;
      const from = latest > span ? latest - span : 1n;
      debug.fromBlock = from;
      debug.toBlock = latest;
      debug.spans += `${span.toString()}(B-) `;
      const chunk = await getLogs_Event_Backwards(pc, initialPair, from, latest, deadline);
      if (chunk.length > 0) { logs = chunk; break; }
    }
  }

  // Factory fallback (env tokens → pair) if still nothing
  if (logs.length === 0 && Date.now() < deadline) {
    const maybePair = await resolvePairFromFactory(pc, chainId);
    if (maybePair && getAddress(maybePair) !== getAddress(initialPair)) {
      debug.fallbackPair = maybePair;
      for (const span of SPANS) {
        if (Date.now() >= deadline) break;
        const from = latest > span ? latest - span : 1n;
        debug.fromBlock = from;
        debug.toBlock = latest;
        debug.spans += `| ${span.toString()}(fallback-) `;
        const chunk = await getLogs_AddressOnly_Backwards(pc, maybePair, from, latest, deadline);
        if (chunk.length > 0) { logs = chunk; debug.pair = maybePair; break; }
      }
    }
  }

  debug.strategy = strategy;
  debug.logsFetched = logs.length;
  debug.timedOut = Date.now() >= deadline;

  // Timestamp cache
  const tsCache = new Map<bigint, number>();
  const blockTs = async (n: bigint) => {
    const hit = tsCache.get(n);
    if (hit !== undefined) return hit;
    const b = await withTimeout(pc.getBlock({ blockNumber: n }), 2500);
    const t = Number(b.timestamp);
    tsCache.set(n, t);
    return t;
  };

  const rows: SwapRow[] = [];
  for (const log of logs) {
    const args = (log as any).args || {};
    const a0i = (args.amount0In  ?? 0n) as bigint;
    const a1i = (args.amount1In  ?? 0n) as bigint;
    const a0o = (args.amount0Out ?? 0n) as bigint;
    const a1o = (args.amount1Out ?? 0n) as bigint;

    const trader = (args.sender ?? ZERO) as Address;
    const to = (args.to ?? ZERO) as Address;

    // direction by dominant side
    let inRaw: bigint, outRaw: bigint, inSym: string, outSym: string, inDec: number, outDec: number;
    if (a0i > a1i || (a0i > 0n && a1o > 0n)) {
      inRaw = a0i; outRaw = a1o; inSym = meta.sym0; outSym = meta.sym1; inDec = meta.dec0; outDec = meta.dec1;
    } else {
      inRaw = a1i; outRaw = a0o; inSym = meta.sym1; outSym = meta.sym0; inDec = meta.dec1; outDec = meta.dec0;
    }
    if (inRaw === 0n && outRaw === 0n) continue;

    rows.push({
      hash: log.transactionHash as Hash,
      trader,
      amountIn:  formatUnits(inRaw,  inDec),
      amountOut: formatUnits(outRaw, outDec),
      tokenIn: inSym,
      tokenOut: outSym,
      blockNumber: log.blockNumber as bigint,
      timestamp: await blockTs(log.blockNumber as bigint),
      to,
    });
  }

  rows.sort((a, b) =>
    a.blockNumber === b.blockNumber ? 0 : a.blockNumber > b.blockNumber ? -1 : 1
  );

  return { rows, debug };
};

/* ======================== Hook ======================== */

export function useSwapHistory(overridePair?: Address) {
  const chainId = useChainId();
  const publicClient = usePublicClient();

  // Resolve pair: override → env
  const { data: pair } = useQuery({
    queryKey: ["swapPair", chainId, overridePair, envPair(chainId)],
    queryFn: async () => {
      if (!publicClient || !chainId) return undefined;
      if (overridePair && !isZero(overridePair)) return getAddress(overridePair) as Address;
      return envPair(chainId);
    },
    enabled: !!publicClient && !!chainId,
    staleTime: 5 * 60_000,
  });

  const query = useQuery({
    queryKey: ["swapHistory", chainId, pair],
    queryFn: () => fetchSwaps(publicClient, chainId!, pair),
    enabled: !!publicClient && !!chainId && !!pair,
    refetchInterval: 60_000,
    retry: false,
  });

  const rows  = (query.data as any)?.rows ?? [];
  const debug = (query.data as any)?.debug ?? ({ pair, chainId } as SwapDebug);
  return { ...query, data: rows, debug, pair, chainId };
}
