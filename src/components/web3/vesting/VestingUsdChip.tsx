// src/components/web3/vesting/VestingUsdChip.tsx
"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { usePrewaUsdPrice } from "@/hooks/usePrewaUsdPrice";

type AnySchedule = Record<string, any>;

function toTokenFloat(v: unknown, decimals = 18): number {
  if (typeof v === "bigint") return Number(formatUnits(v, decimals));
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function readFirst(existing: AnySchedule, keys: string[], decimals: number) {
  for (const k of keys) {
    const val = existing?.[k];
    if (val !== undefined && val !== null) return toTokenFloat(val, decimals);
  }
  return 0;
}

/**
 * Shows "~$XYZ USD" where XYZ = SUM( (Total Vested - Released) ) across schedules.
 * Flexible: understands common field names.
 */
export default function VestingUsdChip({
  schedules,
  decimals = 18,
  title = "Unreleased value",
}: {
  schedules: AnySchedule[] | undefined;
  decimals?: number;
  title?: string;
}) {
  const { priceUsd } = usePrewaUsdPrice();

  const { totalTokens, tooltip } = useMemo(() => {
    if (!Array.isArray(schedules) || schedules.length === 0)
      return { totalTokens: 0, tooltip: "" };

    const VESTED_KEYS   = ["totalVested", "vested", "vestedAmount", "total", "totalAmount"];
    const RELEASED_KEYS = ["released", "claimed", "releasedAmount"];

    let sum = 0;
    for (const s of schedules) {
      const vested = readFirst(s, VESTED_KEYS, decimals);
      const released = readFirst(s, RELEASED_KEYS, decimals);
      const unreleased = Math.max(vested - released, 0);
      sum += unreleased;
    }

    const tip = `Sum over list: (Total Vested − Released) = ${sum.toLocaleString(undefined, {
      maximumFractionDigits: 4,
    })} pREWA`;
    return { totalTokens: sum, tooltip: tip };
  }, [schedules, decimals]);

  const usd = priceUsd !== undefined ? totalTokens * priceUsd : undefined;

  if (usd === undefined) {
    return (
      <span className="text-xs rounded-full bg-muted px-2 py-1" title={title}>
        ~$… USD
      </span>
    );
  }

  return (
    <span
      className="text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-2.5 py-1"
      title={`${title} — ${tooltip} @ $${priceUsd?.toFixed?.(6)} / pREWA`}
    >
      ~${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
    </span>
  );
}
