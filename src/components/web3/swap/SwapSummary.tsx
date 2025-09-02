// src/components/web3/swap/SwapSummary.tsx
"use client";

import React, { useMemo } from "react";
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

// Derive the UI-friendly fields expected by the old component
function toDisplay(row: SwapRow) {
  const a0in = Number(row.amount0In || "0");
  const a1in = Number(row.amount1In || "0");
  const a0out = Number(row.amount0Out || "0");
  const a1out = Number(row.amount1Out || "0");

  // tokenIn/amountIn is whichever side has non-zero “in”
  let tokenIn = "";
  let amountIn = 0;
  if (a0in > 0) {
    tokenIn = row.sym0;
    amountIn = a0in;
  } else if (a1in > 0) {
    tokenIn = row.sym1;
    amountIn = a1in;
  }

  // tokenOut/amountOut is whichever side has non-zero “out”
  let tokenOut = "";
  let amountOut = 0;
  if (a0out > 0) {
    tokenOut = row.sym0;
    amountOut = a0out;
  } else if (a1out > 0) {
    tokenOut = row.sym1;
    amountOut = a1out;
  }

  return {
    ...row,
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
  };
}

function tsToUtc(ts?: bigint) {
  if (!ts) return "—";
  try {
    const d = new Date(Number(ts) * 1000);
    // YYYY-MM-DD HH:mm:ss
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "UTC",
    })
      .format(d)
      .replace(",", "");
  } catch {
    return "—";
  }
}

const SwapSummary: React.FC = () => {
  const { data, chainId, pair, debug } = useSwapHistory();

  const rows = useMemo(() => (data ?? []).map(toDisplay), [data]);
  const base = explorerBase(chainId);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Recent Swaps</h3>
        {pair ? (
          <a
            className="text-xs underline text-green-600"
            href={`${base}/address/${pair}`}
            target="_blank"
            rel="noreferrer"
          >
            View Pair
          </a>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="text-xs text-greyscale-500 px-3 py-2 border rounded">
          No swaps found yet.
        </div>
      ) : (
        <div className="border rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-greyscale-50">
              <tr className="text-left">
                <th className="px-3 py-2 w-[160px]">Date (UTC)</th>
                <th className="px-3 py-2">Summary</th>
                <th className="px-3 py-2 w-[90px]">Tx</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={`${s.hash}-${s.blockNumber}-${s.logIndex}`} className="border-t">
                  <td className="px-3 py-2">{tsToUtc(s.timestamp)}</td>
                  <td className="px-3 py-2">
                    {`Swap ${Number(s.amountIn).toFixed(4)} ${s.tokenIn} for ${Number(
                      s.amountOut
                    ).toFixed(4)} ${s.tokenOut}`}
                  </td>
                  <td className="px-3 py-2">
                    <a
                      className="text-green-600 underline"
                      href={`${base}/tx/${s.hash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
            scanned:{" "}
            <b>
              {debug.fromBlock?.toString()} → {debug.toBlock?.toString()}
            </b>
          </span>
        )}
        {debug?.logsFetched !== undefined && (
          <span>
            rows: <b>{debug.logsFetched}</b>
          </span>
        )}
      </div>
    </div>
  );
};

export default SwapSummary;
