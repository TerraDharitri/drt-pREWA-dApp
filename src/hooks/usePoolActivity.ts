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

/* ============ Types ============ */

export type ActivityRow = {
  kind: "swap" | "mint" | "burn";
  pair: Address;
  hash: Hash;
  blockNumber: bigint;
  timestamp: number;
  trader: Address;
  to?: Address;
  token0: string;
  token1: string;
  amount0: string;
  amount1: string;
};

export type ActivityDebug = {
  chainId?: number;
  pairsTried?: Address[];
  latestBlock?: bigint;
  fromBlock?: bigint;
  toBlock?: bigint;
  logsFetched?: number;
  spans?: string;
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

/* ============ Config / ABIs ============ */

const ZERO = "0x0000000000000000000000000000000000000000" as Address;
const isZero = (a?: Address) => !a || getAddress(a) === getAddress(ZERO);

const SWAP_TOPIC: Hex = keccak256(
  toBytes("Swap(address,uint256,uint256,uint256,uint256,address)")
);
const MINT_TOPIC: Hex = keccak256(toBytes("Mint(address,uint256,uint256)"));
const BURN_TOPIC: Hex = keccak256(toBytes("Burn(address,uint256,uint256,address)"));

const V2_MINT_EVENT = {
  type: "event",
  name: "Mint",
  inputs: [
    { indexed: true, name: "sender", type: "address" },
    { indexed: false, name: "amount0", type: "uint256" },
    { indexed: false, name: "amount1", type: "uint256" },
  ],
} as const;

const V2_BURN_EVENT = {
  type: "event",
  name: "Burn",
  inputs: [
    { indexed: true, name: "sender", type: "address" },
    { indexed: false, name: "amount0", type: "uint256" },
    { indexed: false, name: "amount1", type: "uint256" },
    { indexed: true, name: "to", type: "address" },
  ],
} as const;

const SPANS: bigint[] = [2_000_000n, 1_000_000n, 500_000n, 250_000n, 100_000n];
const CHUNK_TIMEOUT_MS = 4000;
const TOTAL_BUDGET_MS = 20000;

const FACTORY: Record<number, Address> = {
  56: "0xCA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
  97: "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
} as const;

const WBNB: Record<number, Address> = {
  56: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  97: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
} as const;

const KNOWN_USDT: Record<number, Address> = {
  56: "0x55d398326f99059fF775485246999027B3197955",
  97: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
} as const;

const ERC20_SYMBOL_STRING_ABI = [
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
] as const;
const ERC20_SYMBOL_BYTES32_ABI = [
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
] as const;
const ERC20_DECIMALS_ABI = [
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;

/* ============ Envs ============ */

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

/* ============ Utils ============ */

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
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

async function getPair(pc: PublicClient, chainId: number, a?: Address, b?: Address) {
  const factory = FACTORY[chainId];
  if (!factory || !a || !b) return undefined;
  try {
    const addr = (await withTimeout(
      pc.readContract({
        address: factory,
        abi: [
          { name: "getPair", type: "function", stateMutability: "view",
            inputs: [{ type: "address" }, { type: "address" }],
            outputs: [{ type: "address" }] },
        ] as const,
        functionName: "getPair",
        args: [a, b],
      }) as Promise<Address>,
      2500
    )) as Address;
    const normalized = getAddress(addr) as Address;
    return isZero(normalized) ? undefined : normalized;
  } catch { return undefined; }
}

/* ============ Backward scan ============ */

async function scanPairBackwards(
  pc: PublicClient,
  pair: Address,
  fromBlock: bigint,
  toBlock: bigint,
  deadline: number,
  meta: PairMeta
): Promise<ActivityRow[]> {
  const out: ActivityRow[] = [];
  let STEP = 50_000n;

  const topicSet = new Set([SWAP_TOPIC, MINT_TOPIC, BURN_TOPIC]);

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
          const t0 = l.topics[0] as Hex;
          if (!topicSet.has(t0)) continue;

          if (t0 === SWAP_TOPIC) {
            try {
              const ev = decodeEventLog({
                abi: [pREWAAbis.SwapEvent] as const,
                data: l.data as Hex,
                topics: [SWAP_TOPIC, ...((l.topics.slice(1) ?? []) as Hex[])] as [Hex, ...Hex[]],
                strict: false,
              }) as any;
              const args = ev.args || {};
              const a0i = (args.amount0In  ?? 0n) as bigint;
              const a1i = (args.amount1In  ?? 0n) as bigint;
              const a0o = (args.amount0Out ?? 0n) as bigint;
              const a1o = (args.amount1Out ?? 0n) as bigint;

              out.push({
                kind: "swap",
                pair,
                hash: l.transactionHash as Hash,
                blockNumber: l.blockNumber as bigint,
                timestamp: 0,
                trader: (args.sender ?? ZERO) as Address,
                to: (args.to ?? ZERO) as Address,
                token0: meta.sym0,
                token1: meta.sym1,
                // show gross movement per token (a0i+a0o etc. keeps table simple)
                amount0: formatUnits(a0i + a0o, meta.dec0),
                amount1: formatUnits(a1i + a1o, meta.dec1),
              });
            } catch {}
          } else if (t0 === MINT_TOPIC) {
            try {
              const ev = decodeEventLog({
                abi: [V2_MINT_EVENT] as const,
                data: l.data as Hex,
                topics: [MINT_TOPIC, ...((l.topics.slice(1) ?? []) as Hex[])] as [Hex, ...Hex[]],
                strict: false,
              }) as any;
              const args = ev.args || {};
              out.push({
                kind: "mint",
                pair,
                hash: l.transactionHash as Hash,
                blockNumber: l.blockNumber as bigint,
                timestamp: 0,
                trader: (args.sender ?? ZERO) as Address,
                token0: meta.sym0,
                token1: meta.sym1,
                amount0: formatUnits((args.amount0 ?? 0n) as bigint, meta.dec0),
                amount1: formatUnits((args.amount1 ?? 0n) as bigint, meta.dec1),
              });
            } catch {}
          } else if (t0 === BURN_TOPIC) {
            try {
              const ev = decodeEventLog({
                abi: [V2_BURN_EVENT] as const,
                data: l.data as Hex,
                topics: [BURN_TOPIC, ...((l.topics.slice(1) ?? []) as Hex[])] as [Hex, ...Hex[]],
                strict: false,
              }) as any;
              const args = ev.args || {};
              out.push({
                kind: "burn",
                pair,
                hash: l.transactionHash as Hash,
                blockNumber: l.blockNumber as bigint,
                timestamp: 0,
                trader: (args.sender ?? ZERO) as Address,
                to: (args.to ?? ZERO) as Address,
                token0: meta.sym0,
                token1: meta.sym1,
                amount0: formatUnits((args.amount0 ?? 0n) as bigint, meta.dec0),
                amount1: formatUnits((args.amount1 ?? 0n) as bigint, meta.dec1),
              });
            } catch {}
          }
        }
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

  return out;
}

/* ============ Fetch ============ */

async function fetchActivity(
  pc: PublicClient | null,
  chainId: number,
  initialPair?: Address
): Promise<{ rows: ActivityRow[]; debug: ActivityDebug }> {
  const debug: ActivityDebug = { chainId, pairsTried: [], spans: "" };

  if (!pc) return { rows: [], debug: { ...debug, reason: "no publicClient" } };

  const prewa = envToken(chainId, "PREWA");
  const usdt  = envToken(chainId, "USDT") ?? KNOWN_USDT[chainId];
  const wbnb  = WBNB[chainId];

  const candidates = new Set<Address>();
  if (initialPair && !isZero(initialPair)) candidates.add(getAddress(initialPair) as Address);
  else {
    const env = envPair(chainId);
    if (env && !isZero(env)) candidates.add(getAddress(env) as Address);
  }
  if (prewa && usdt) {
    const d = await getPair(pc, chainId, prewa, usdt);
    if (d) candidates.add(d);
  }
  if (prewa && wbnb) {
    const b = await getPair(pc, chainId, prewa, wbnb);
    if (b) candidates.add(b);
  }

  if (candidates.size === 0) {
    return { rows: [], debug: { ...debug, reason: "no pairs to try" } };
  }

  const latest = await withTimeout(pc.getBlockNumber(), 3000);
  debug.latestBlock = latest;

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const rows: ActivityRow[] = [];

  const tsCache = new Map<bigint, number>();
  const blockTs = async (n: bigint) => {
    const hit = tsCache.get(n);
    if (hit !== undefined) return hit;
    const b = await withTimeout(pc.getBlock({ blockNumber: n }), 2500);
    const t = Number(b.timestamp);
    tsCache.set(n, t);
    return t;
  };

  for (const pair of candidates) {
    if (Date.now() >= deadline) break;
    debug.pairsTried!.push(pair);

    const meta = await loadPairMeta(pc, pair);

    for (const span of SPANS) {
      if (Date.now() >= deadline) break;
      const from = latest > span ? latest - span : 1n;
      debug.fromBlock = from;
      debug.toBlock = latest;
      debug.spans += `${span.toString()}(A-) `;

      const chunk = await scanPairBackwards(pc, pair, from, latest, deadline, meta);
      for (const r of chunk) {
        r.timestamp = await blockTs(r.blockNumber);
        rows.push(r);
      }
      if (chunk.length > 0) break;
    }
  }

  rows.sort((a, b) =>
    a.blockNumber === b.blockNumber ? 0 : a.blockNumber > b.blockNumber ? -1 : 1
  );

  debug.logsFetched = rows.length;
  debug.timedOut = Date.now() >= deadline;

  return { rows, debug };
}

/* ============ Hook ============ */

export function usePoolActivity(overridePair?: Address) {
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const query = useQuery({
    queryKey: ["poolActivity", chainId, overridePair, envPair(chainId)],
    queryFn: () => fetchActivity(publicClient, chainId!, overridePair ?? envPair(chainId)),
    enabled: !!publicClient && !!chainId,
    refetchInterval: 60_000,
    retry: false,
  });

  const rows  = (query.data as any)?.rows ?? [];
  const debug = (query.data as any)?.debug ?? ({ chainId } as ActivityDebug);
  return { ...query, data: rows as ActivityRow[], debug };
}
