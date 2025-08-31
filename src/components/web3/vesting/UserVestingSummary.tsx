// src/components/web3/vesting/UserVestingSummary.tsx

"use client";
import React from "react";
import { useReadVestingSchedules } from "@/hooks/useReadVestingSchedules";
import { VestingScheduleRow } from "./VestingScheduleRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useProtocolStats } from "@/hooks/useProtocolStats";
import { TOKEN_LISTS } from "@/constants/tokens";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

interface UserVestingSummaryProps {
  isAdmin: boolean;
}

/**
 * Renders a vesting table. The header shows an estimated USD value
 * computed as: SUM( Total Vested − Released ) across the displayed list.
 * (priced using pREWA → USD from useProtocolStats)
 */
export function UserVestingSummary({ isAdmin = false }: UserVestingSummaryProps) {
  const { schedules, isLoading, isError } = useReadVestingSchedules(isAdmin);
  const { prewaPriceRaw, isLoading: isLoadingPrice } = useProtocolStats();
  const { chainId } = useAccount();

  // pREWA decimals for current chain (fallback 18)
  const prewaDecimals = React.useMemo(() => {
    const tokens = chainId ? TOKEN_LISTS[chainId as keyof typeof TOKEN_LISTS] : [];
    return tokens.find((t) => t.symbol === "pREWA")?.decimals ?? 18;
  }, [chainId]);

  // USD chip value for the list being displayed: SUM(total - released) * price
  const totalUsd = React.useMemo(() => {
    if (!Array.isArray(schedules) || schedules.length === 0) return null;
    if (isLoadingPrice || !prewaPriceRaw) return null;

    // BigInt sum in token units
    const unreleasedWei = schedules.reduce(
      (sum, s) => sum + (s.totalAmount - s.releasedAmount),
      0n as bigint
    );

    const unreleased = Number(formatUnits(unreleasedWei, prewaDecimals));
    const usd = unreleased * Number(prewaPriceRaw);

    // Guard NaN / Infinity
    if (!Number.isFinite(usd)) return null;

    return usd.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [schedules, prewaPriceRaw, isLoadingPrice, prewaDecimals]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Spinner />
          <span className="ml-2">Loading vesting schedules...</span>
        </div>
      );
    }

    if (isError) {
      return (
        <p className="p-4 text-center text-error-100">
          Failed to load vesting schedules.
        </p>
      );
    }

    if (!schedules || schedules.length === 0) {
      const message = isAdmin
        ? "No vesting schedules found on the protocol."
        : "No vesting schedules found for your address.";
      return <p className="p-4 text-center text-greyscale-400">{message}</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Beneficiary
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Total Vested
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Released
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Releasable
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Start Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Cliff
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {schedules.map((schedule) => (
              <VestingScheduleRow key={schedule.id} schedule={schedule} />
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const titleBase = isAdmin
    ? `All Protocol Vesting Schedules (${isLoading ? "..." : schedules.length})`
    : `Your Vesting Schedules (${isLoading ? "..." : schedules.length})`;

  const header = (
    <div className="flex items-center justify-between">
      <span>{titleBase}</span>
      {isLoading || isLoadingPrice ? (
        <Spinner className="h-4 w-4" />
      ) : totalUsd ? (
        <span className="text-base font-normal text-gray-500 dark:text-gray-400">
          ~${totalUsd} USD
        </span>
      ) : null}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{header}</CardTitle>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
