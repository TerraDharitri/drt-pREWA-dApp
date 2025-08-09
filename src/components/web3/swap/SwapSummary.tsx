// src/components/web3/swap/SwapSummary.tsx
"use client";

import React from "react";
import { useAccount, usePublicClient } from "wagmi";
import type { Address, Hex } from "viem";
import { formatUnits, getAddress } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

/** TODO: put your real pair address(es) here */
const PAIR_ADDRESSES: Address[] = [
  // "0xYourPairAddress" as Address,
];

/** Set proper decimals for your tokens */
const TOKEN_DECIMALS = 18; // pREWA
const QUOTE_DECIMALS = 18; // BNB/USDT (change to 6 if your USDT is 6)

const PAIR_ABI = [
  {
    type: "event",
    name: "Swap",
    inputs: [
      { indexed: true, name: "sender", type: "address" },
      { indexed: false, name: "amount0In", type: "uint256" },
      { indexed: false, name: "amount1In", type: "uint256" },
      { indexed: false, name: "amount0Out", type: "uint256" },
      { indexed: false, name: "amount1Out", type: "uint256" },
      { indexed: true, name: "to", type: "address" },
    ],
    anonymous: false,
  },
] as const;

const narrowChainId = (id?: number) => (id === 56 ? 56 : id === 97 ? 97 : undefined);

type SwapRow = {
  hash: Hex;
  blockNumber: bigint;
  pair: Address;
  trader: Address;
  tokenDelta: bigint; // +out -in (heuristic)
  quoteDelta: bigint; // +out -in
  direction: "BUY" | "SELL";
  timestamp?: number;
};

export function SwapSummary() {
  const { chainId } = useAccount();
  const client = usePublicClient({ chainId: narrowChainId(chainId) });

  const [rows, setRows] = React.useState<SwapRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const windowHrs = 24;

  const load = React.useCallback(async () => {
    if (!client || PAIR_ADDRESSES.length === 0) return;
    setLoading(true);
    setErr(null);
    try {
      const latest = await client.getBlockNumber();
      const lookback = 28_800n; // ~24h on BSC
      const fromBlock = latest > lookback ? latest - lookback : 1n;

      const gathered: SwapRow[] = [];
      for (const pair of PAIR_ADDRESSES) {
        const logs = await client.getLogs({
          address: pair,
          event: { ...(PAIR_ABI[0] as any), type: "event" },
          fromBlock,
          toBlock: latest,
        });

        for (const lg of logs) {
          const a = (lg as any).args as {
            sender: Address;
            amount0In: bigint;
            amount1In: bigint;
            amount0Out: bigint;
            amount1Out: bigint;
            to: Address;
          };

          // Heuristic (V2-style): treat token as token0, quote as token1.
          const tokenDelta = a.amount0Out - a.amount0In;
          const quoteDelta = a.amount1Out - a.amount1In;
          const direction: "BUY" | "SELL" = tokenDelta > 0n ? "BUY" : "SELL";

          gathered.push({
            hash: lg.transactionHash as Hex,
            blockNumber: lg.blockNumber!,
            pair: getAddress(pair),
            trader: a.sender,
            tokenDelta,
            quoteDelta,
            direction,
          });
        }
      }

      // attach timestamps for recent cutoff
      const blockMap = new Map<bigint, number>();
      const uniques = [...new Set(gathered.map((r) => r.blockNumber))];
      for (const bn of uniques) {
        try {
          const b = await client.getBlock({ blockNumber: bn });
          blockMap.set(bn, Number(b.timestamp));
        } catch {}
      }

      const cutoff = Math.floor(Date.now() / 1000) - windowHrs * 3600;
      const final = gathered
        .map((r) => ({ ...r, timestamp: blockMap.get(r.blockNumber) }))
        .filter((r) => !r.timestamp || r.timestamp >= cutoff)
        .sort((a, b) => Number(b.blockNumber - a.blockNumber));

      setRows(final);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load swaps");
    } finally {
      setLoading(false);
    }
  }, [client]);

  React.useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const totalSwaps = rows.length;
  const totalToken = rows.reduce((acc, r) => acc + (r.tokenDelta >= 0n ? r.tokenDelta : -r.tokenDelta), 0n);
  const totalQuote = rows.reduce((acc, r) => acc + (r.quoteDelta >= 0n ? r.quoteDelta : -r.quoteDelta), 0n);
  const uniqueTraders = new Set(rows.map((r) => r.trader.toLowerCase())).size;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Swap Summary (Last {windowHrs}h)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm"><Spinner /> Loading…</div>
        ) : err ? (
          <div className="text-sm text-red-500">{err}</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-500">No swaps found.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="rounded border p-3">
                <div className="opacity-60">Swaps</div>
                <div className="text-lg font-semibold">{totalSwaps}</div>
              </div>
              <div className="rounded border p-3">
                <div className="opacity-60">Volume (pREWA)</div>
                <div className="text-lg font-semibold">
                  {formatUnits(totalToken, TOKEN_DECIMALS)}
                </div>
              </div>
              <div className="rounded border p-3">
                <div className="opacity-60">Volume (Quote)</div>
                <div className="text-lg font-semibold">
                  {formatUnits(totalQuote, QUOTE_DECIMALS)}
                </div>
              </div>
              <div className="rounded border p-3">
                <div className="opacity-60">Traders</div>
                <div className="text-lg font-semibold">{uniqueTraders}</div>
              </div>
            </div>

            <div className="rounded border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-3 py-2">Block</th>
                    <th className="text-left px-3 py-2">Direction</th>
                    <th className="text-left px-3 py-2">pREWA Δ</th>
                    <th className="text-left px-3 py-2">Quote Δ</th>
                    <th className="text-left px-3 py-2">Trader</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 10).map((r) => (
                    <tr key={`${r.hash}-${r.blockNumber.toString()}`} className="border-t">
                      <td className="px-3 py-2">{r.blockNumber.toString()}</td>
                      <td className="px-3 py-2">
                        <span className={r.direction === "BUY" ? "text-emerald-600" : "text-rose-600"}>
                          {r.direction}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {formatUnits(r.tokenDelta >= 0n ? r.tokenDelta : -r.tokenDelta, TOKEN_DECIMALS)}
                      </td>
                      <td className="px-3 py-2">
                        {formatUnits(r.quoteDelta >= 0n ? r.quoteDelta : -r.quoteDelta, QUOTE_DECIMALS)}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {r.trader.slice(0, 6)}…{r.trader.slice(-4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
