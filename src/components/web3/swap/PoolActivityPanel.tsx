"use client";

import * as React from "react";
import type { Address } from "viem";
import { useChainId } from "wagmi";
import { usePoolActivity } from "@/hooks/usePoolActivity";

function short(a?: string) {
  if (!a) return "";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function PoolActivityPanel({
  defaultPair,
  className,
}: {
  defaultPair?: Address;
  className?: string;
}) {
  const chainId = useChainId();
  const [override, setOverride] = React.useState<Address | undefined>(defaultPair);
  const { data: rows, isLoading } = usePoolActivity(override);

  const bscan =
    chainId === 97
      ? "https://testnet.bscscan.com"
      : "https://bscscan.com";

  return (
    <div className={className ?? "mt-6 rounded-2xl border border-gray-200 p-4"}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Recent Activity (30d)</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Pair:</span>
          <input
            className="w-[320px] rounded-md border border-gray-300 bg-white px-2 py-1 text-xs outline-none"
            placeholder="Override pair 0x… (optional)"
            defaultValue={defaultPair ?? ""}
            onBlur={(e) => {
              const v = e.currentTarget.value.trim();
              setOverride(v && v.startsWith("0x") && v.length === 42 ? (v as Address) : undefined);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-xs text-gray-500">Loading activity…</div>
      ) : rows.length === 0 ? (
        <div className="text-xs text-gray-500">No swaps or LP events found in the recent window.</div>
      ) : (
        <div className="max-h-72 overflow-auto rounded-lg border border-gray-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2">Block</th>
                <th className="px-3 py-2">Kind</th>
                <th className="px-3 py-2">Token0</th>
                <th className="px-3 py-2">Token1</th>
                <th className="px-3 py-2">Amount0</th>
                <th className="px-3 py-2">Amount1</th>
                <th className="px-3 py-2">Tx</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.hash}-${r.blockNumber}`} className="border-b last:border-none">
                  <td className="px-3 py-2">{r.blockNumber.toString()}</td>
                  <td className="px-3 py-2">{r.kind}</td>
                  <td className="px-3 py-2">{r.token0}</td>
                  <td className="px-3 py-2">{r.token1}</td>
                  <td className="px-3 py-2">{r.amount0}</td>
                  <td className="px-3 py-2">{r.amount1}</td>
                  <td className="px-3 py-2">
                    <a
                      className="underline"
                      href={`${bscan}/tx/${r.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      title={r.hash}
                    >
                      {short(r.hash)}
                    </a>
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
