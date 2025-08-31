"use client";
import React from "react";
import { useReadStakingPositions } from "@/hooks/useReadStakingPositions";
import { StakingPositionRow } from "./StakingPositionRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

interface UserStakingSummaryProps {
  onPositionsLoaded?: (totalCount: number) => void;
}

export function UserStakingSummary({ onPositionsLoaded }: UserStakingSummaryProps) {
  const { positions, isLoading, isError } = useReadStakingPositions();

  React.useEffect(() => {
    if (!isLoading && onPositionsLoaded) {
      onPositionsLoaded(positions.length);
    }
  }, [isLoading, positions, onPositionsLoaded]);

  const activePositions = positions.filter((p) => p.active);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Spinner />
          <span className="ml-2">Loading your staking positions...</span>
        </div>
      );
    }

    if (isError) {
      return <p className="p-4 text-center text-error-100">Failed to load staking positions.</p>;
    }

    if (activePositions.length === 0) {
      return <p className="p-4 text-center text-greyscale-400">You have no active staking positions.</p>;
    }

    // FIX: Removed table-fixed and colgroup. Wrapped the table in a div with overflow-x-auto.
    return (
      <div className="w-full overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs leading-tight font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs leading-tight font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs leading-tight font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Tier ID
              </th>
              <th className="px-4 py-3 text-left text-xs leading-tight font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs leading-tight font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Start Time
              </th>
              <th className="px-4 py-3 text-left text-xs leading-tight font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                End Time
              </th>
              <th className="px-4 py-3 text-left text-xs leading-tight font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Pending Rewards
              </th>
              <th className="px-4 py-3 text-left text-xs leading-tight font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Expected Rewards
              </th>
              <th className="px-4 py-3 text-right text-xs leading-tight font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {activePositions.map((pos, index) => (
              <StakingPositionRow key={pos.positionId.toString()} position={pos} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Active Staking Positions ({activePositions.length})</CardTitle>
      </CardHeader>
      {/* FIX: CardContent now renders directly without an extra div */}
      <CardContent className="p-0 sm:p-6">{renderContent()}</CardContent>
    </Card>
  );
}