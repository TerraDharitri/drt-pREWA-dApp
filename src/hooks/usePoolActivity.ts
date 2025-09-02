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

// Narrow interface to avoid version type mismatches between wagmi/viem.
// Only declares the methods we actually use in this hook.
type MinimalPublicClient = {
  chain?: { id: number };
  readContract: (args: any) => Promise<any>;
  getLogs: (args: any) => Promise<any[]>;
  getBlockNumber: () => Promise<bigint>;
  getBlock: (args: any) => Promise<{ timestamp: bigint } & Record<string, any>>;
  getTransactionReceipt: (args: any) => Promise<any>;
};

type ActivityRow = {
  // original/internal fields
  blockNumber: bigint;
  txHash: Hash;
  logIndex: number;
  type: "Swap" | "Mint" | "Burn";
  assetIn?: string;
  assetOut?: string;
  amountIn?: string;
  amountOut?: string;
  timestamp?: bigint;

  // 🔁 aliases/columns expected by UI (PoolActivityPanel)
  hash: Hash;                                  // alias of txHash
  kind: "Swap" | "Mint" | "Burn";              // alias of type
  token0?: string;                              // meta.sym0
  token1?: string;                              // meta.sym1
  amount0?: string;                             // formatted amount for token0 column
  amount1?: string;                             // formatted amount for token1 column
};

type ActivityDebug = {
  chainId?: number;
  fromBlock?: bigint;
  toBlock?: bigint;
  spans?: string;
  logsFetched?: number;
  timedOut?: boolean;
  reason?: string;
  pairsTried: Address[];
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

const ZERO = "0x0000000000000000000000000000000000000000" as const;

const KNOWN_USDT: Record<number, Address> = {
  56: "0x55d398326f99059fF775485246999027B3197955",
  97: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
};

const WBNB: Record<number, Address> = {
  56: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  97: "0xae13d989dac2f0debff460ac112a837c89baa7cd",
};

const FACTORY: Record<number, Address> = {
  56: "0x1097053Fd2ea711dad45caCcc45EfF7548fCB362",
  97: "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
};

const SWAP_TOPIC = keccak256(toBytes("Swap(address,uint256,uint256,uint256,uint256,address)"));
const MINT_TOPIC = keccak256(toBytes("Mint(address,uint256,uint256)"));
const BURN_TOPIC = keccak256(toBytes("Burn(address,uint256,uint256,address)"));

const SPANS = [5_000n, 20_000n, 40_000n, 120_000n, 240_000n] as const; // blocks to scan in chunks
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

/* ============ Envs ============ */

function envPair(chainId?: number): Address | undefined {
  if (!chainId) return undefined;
  const v =
    chainId === 97
      ? process.env.NEXT_PUBLIC_SWAP_PAIR_97
      : process.env.NEXT_PUBLIC_SWAP_PAIR_56;
  if (!v) return undefined;
  try { return getAddress(v) as Address; } catch { return undefined; }
}

function isZero(a?: Address): boolean {
  return !a || a.toLowerCase() === ZERO;
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

async function loadPairMeta(pc: MinimalPublicClient, pair: Address): Promise<PairMeta> {
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

async function getPair(pc: MinimalPublicClient, chainId: number, a?: Address, b?: Address) {
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
    if (!isZero(addr)) return addr as Address;
  } catch {}
  return undefined;
}

/* ============ Backward scan ============ */

async function scanPairBackwards(
  pc: MinimalPublicClient,
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
          if (!topicSet.has(l.topics[0]!)) continue;

          if (l.topics[0] === SWAP_TOPIC) {
            const ev = decodeEventLog({
             abi: pREWAAbis.TypedIPancakePair,
             data: l.data as Hex,
             topics: [l.topics![0] as Hex, ...(l.topics!.slice(1) as Hex[])] as [`0x${string}`, ...`0x${string}`[]],
           });
            const [, amount0In, amount1In, amount0Out, amount1Out] = ev.args as any[];

            // human-readable amounts
            const a0in  = amount0In  && amount0In  > 0n ? formatUnits(amount0In,  meta.dec0) : "";
            const a1in  = amount1In  && amount1In  > 0n ? formatUnits(amount1In,  meta.dec1) : "";
            const a0out = amount0Out && amount0Out > 0n ? formatUnits(amount0Out, meta.dec0) : "";
            const a1out = amount1Out && amount1Out > 0n ? formatUnits(amount1Out, meta.dec1) : "";

            // columns for token0/token1 (use +/- to hint direction)
            const amount0 = a0out ? `+${a0out}` : a0in ? `-${a0in}` : "0";
            const amount1 = a1out ? `+${a1out}` : a1in ? `-${a1in}` : "0";

            let assetIn = "";
            let assetOut = "";
            let amountIn = "";
            let amountOut = "";

            if (a0in)  { assetIn  = meta.sym0; amountIn  = a0in;  }
            if (a1in)  { assetIn  = meta.sym1; amountIn  = a1in;  }
            if (a0out) { assetOut = meta.sym0; amountOut = a0out; }
            if (a1out) { assetOut = meta.sym1; amountOut = a1out; }

            out.push({
              blockNumber: l.blockNumber!,
              txHash: l.transactionHash!,
              logIndex: Number(l.logIndex!),
              type: "Swap",
              assetIn,
              assetOut,
              amountIn,
              amountOut,
              // aliases for UI
              hash: l.transactionHash!,
              kind: "Swap",
              token0: meta.sym0,
              token1: meta.sym1,
              amount0,
              amount1,
            });
          } else if (l.topics[0] === MINT_TOPIC) {
            const ev = decodeEventLog({
              abi: pREWAAbis.TypedIPancakePair,
              data: l.data as Hex,
              topics: [l.topics![0] as Hex, ...(l.topics!.slice(1) as Hex[])] as [`0x${string}`, ...`0x${string}`[]],
            });
            const [, amount0, amount1] = ev.args as any[];
            const a0 = formatUnits(amount0, meta.dec0);
            const a1 = formatUnits(amount1, meta.dec1);
            out.push({
              blockNumber: l.blockNumber!,
              txHash: l.transactionHash!,
              logIndex: Number(l.logIndex!),
              type: "Mint",
              assetIn: `${meta.sym0}/${meta.sym1}`,
              amountIn: `${a0} / ${a1}`,
              // aliases for UI
              hash: l.transactionHash!,
              kind: "Mint",
              token0: meta.sym0,
              token1: meta.sym1,
              amount0: `+${a0}`,
              amount1: `+${a1}`,
            });
          } else if (l.topics[0] === BURN_TOPIC) {
            const ev = decodeEventLog({
              abi: pREWAAbis.TypedIPancakePair,
              data: l.data as Hex,
              topics: [l.topics![0] as Hex, ...(l.topics!.slice(1) as Hex[])] as [`0x${string}`, ...`0x${string}`[]],
            });
            const [, amount0, amount1] = ev.args as any[];
            const a0 = formatUnits(amount0, meta.dec0);
            const a1 = formatUnits(amount1, meta.dec1);
            out.push({
              blockNumber: l.blockNumber!,
              txHash: l.transactionHash!,
              logIndex: Number(l.logIndex!),
              type: "Burn",
              assetOut: `${meta.sym0}/${meta.sym1}`,
              amountOut: `${a0} / ${a1}`,
              // aliases for UI
              hash: l.transactionHash!,
              kind: "Burn",
              token0: meta.sym0,
              token1: meta.sym1,
              amount0: `-${a0}`,
              amount1: `-${a1}`,
            });
          }
        }

        break; // we made it through the range
      } catch (err) {
        // On RPC rate limits, reduce the step and retry the same window
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

/* ============ Fetch ============ */

async function fetchActivity(
  pc: MinimalPublicClient | undefined,
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

  const blockTs = async (n: bigint): Promise<bigint> => {
    const b = await withTimeout(pc.getBlock({ blockNumber: n }), 2500);
    return b.timestamp as bigint;
  };

  const rows: ActivityRow[] = [];
  const deadline = Date.now() + 8_000; // whole request max time

  for (const pair of candidates) {
    debug.pairsTried.push(pair);

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
    queryFn: () => fetchActivity(publicClient as unknown as MinimalPublicClient, chainId!, overridePair ?? envPair(chainId)),
    enabled: !!publicClient && !!chainId,
    refetchInterval: 60_000,
    retry: false,
  });

  const rows  = (query.data as any)?.rows ?? [];
  const debug = (query.data as any)?.debug ?? ({ chainId } as ActivityDebug);
  return { ...query, data: rows as ActivityRow[], debug };
}
