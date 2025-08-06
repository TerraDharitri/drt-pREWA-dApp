// src/components/web3/vesting/UserVestingSummary.tsx

"use client";
import React from "react";
import { useReadVestingSchedules } from "@/hooks/useReadVestingSchedules";
import { VestingScheduleRow } from "./VestingScheduleRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

interface UserVestingSummaryProps {
  isAdmin: boolean;
}

export function UserVestingSummary({ isAdmin = false }: UserVestingSummaryProps) {
  const { schedules, isLoading, isError } = useReadVestingSchedules(isAdmin);

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
      return <p className="p-4 text-center text-error-100">Failed to load vesting schedules.</p>;
    }

    if (schedules.length === 0) {
      const message = isAdmin ? "No vesting schedules found on the protocol." : "No vesting schedules found for your address.";
      return <p className="p-4 text-center text-greyscale-400">{message}</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Beneficiary</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Vested</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Released</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Releasable</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Start Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {schedules.map(schedule => (
              <VestingScheduleRow key={schedule.id} schedule={schedule} />
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // FIX: Make the title dynamic based on the context.
  const title = isAdmin 
    ? `All Protocol Vesting Schedules (${isLoading ? '...' : schedules.length})` 
    : `Your Vesting Schedules (${isLoading ? '...' : schedules.length})`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}