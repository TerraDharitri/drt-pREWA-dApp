// src/components/web3/swap/SwapSummary.tsx
"use client";

import React from "react";
import { useSwapHistory, type SwapRow } from "@/hooks/useSwapHistory";

function explorerBase(chainId?: number) {
  switch (chainId) {
    case 97:
      return "https://testnet.bscscan.com";
    case 56:
      return "https://bscscan.com";
    default:
      return "";
  }
}

export function SwapSummary() {
  const [addr, setAddr] = React.useState<string>("");
  const {
    data: swaps = [],
    isLoading,
    pair,
    chainId,
    debug,
  } = useSwapHistory(addr as any);

  const base = explorerBase(chainId);

  return (
    <div className="rounded-xl border border-greyscale-100 dark:border-dark-border">
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-greyscale-100 dark:border-dark-border">
        <div className="font-medium">Recent Swaps (30d)</div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-greyscale-500">Pair:</span>
          <input
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder="Override pair 0x... (optional)"
            className="w-[320px] rounded-md border px-2 py-1 text-xs bg-transparent"
          />
        </div>
      </div>

      {/* tiny diagnostics row */}
      <div className="px-3 py-2 text-[11px] text-greyscale-500 flex flex-wrap gap-4">
        <span>
          chainId: <b>{chainId ?? "—"}</b>
        </span>
        <span>
          pair: <b>{pair ?? "—"}</b>
        </span>
        {debug?.fromBlock && (
          <span>
            from: <b>{debug.fromBlock.toString()}</b>
          </span>
        )}
        {debug?.latestBlock && (
          <span>
            latest: <b>{debug.latestBlock.toString()}</b>
          </span>
        )}
        {typeof debug?.logsFetched === "number" && (
          <span>
            logs: <b>{debug.logsFetched}</b>
          </span>
        )}
        {debug?.stepsTried && (
          <span>
            spans: <b>{debug.stepsTried}</b>
          </span>
        )}
        {debug?.reason && (
          <span>
            note: <b>{debug.reason}</b>
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="px-2 py-8 text-center text-sm">Loading swaps…</div>
      ) : !(swaps as SwapRow[]).length ? (
        <div className="px-2 py-8 text-center text-sm text-greyscale-400">
          No swaps found in the recent window.
        </div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-greyscale-100 bg-greyscale-50/50 dark:border-dark-border dark:bg-dark-surface sticky top-0">
              <tr>
                <th className="px-3 py-2 whitespace-nowrap">Block</th>
                <th className="px-3 py-2 whitespace-nowrap">Tx</th>
                <th className="px-3 py-2 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {(swaps as SwapRow[]).map((s: SwapRow) => (
                <tr
                  key={`${s.hash}-${s.blockNumber}`}
                  className="border-b last:border-b-0 border-greyscale-100/60 dark:border-dark-border/60"
                >
                  <td className="px-3 py-2">{s.blockNumber.toString()}</td>
                  <td className="px-3 py-2">
                    {base ? (
                      <a
                        className="underline"
                        href={`${base}/tx/${s.hash}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {s.hash.slice(0, 8)}…{s.hash.slice(-6)}
                      </a>
                    ) : (
                      <span>{s.hash}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {`Swap ${Number(s.amountIn).toFixed(4)} ${s.tokenIn} for ${Number(
                      s.amountOut
                    ).toFixed(4)} ${s.tokenOut}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SwapSummary;
