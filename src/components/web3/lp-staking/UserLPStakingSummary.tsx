// src/components/web3/lp-staking/UserLPStakingSummary.tsx

"use client";
import React from "react";
import { useReadLPStakingPositions } from "@/hooks/useReadLPStakingPositions";
import { LPStakingPositionRow } from "./LPStakingPositionRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

export function UserLPStakingSummary() {
  const { positions, isLoading, isError } = useReadLPStakingPositions();

  // Filter for positions that are marked as active and have a staked amount greater than zero.
  const activePositions = positions.filter(p => p.active && p.amount > 0n);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Spinner />
          <span className="ml-2">Loading your staked liquidity positions...</span>
        </div>
      );
    }

    if (isError) {
      return <p className="p-4 text-center text-error-100">Failed to load LP staking positions.</p>;
    }

    if (activePositions.length === 0) {
      return <p className="p-4 text-center text-greyscale-400">You have no active LP staking positions.</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Pool</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Staked LP Tokens</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Tier ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Start Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">End Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Pending Rewards</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Expected Rewards</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {activePositions.map(pos => (
              <LPStakingPositionRow key={pos.positionId.toString()} position={pos} />
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Staked Liquidity Positions ({activePositions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}