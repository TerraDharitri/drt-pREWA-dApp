// src/components/web3/vesting/VestingScheduleRow.tsx
"use client";

import React from "react";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { useVestingActions } from "@/hooks/useVestingActions";
import type { VestingScheduleDetails } from "@/hooks/useReadVestingSchedules";
import { useAccount } from "wagmi";

interface VestingScheduleRowProps {
  schedule: VestingScheduleDetails;
}

export function VestingScheduleRow({ schedule }: VestingScheduleRowProps) {
  const { address: connectedAddress } = useAccount();
  const { 
    releaseVestedTokens: release, 
    revokeVestingSchedule: revoke, 
    isLoading 
  } = useVestingActions();

  const isBeneficiary = connectedAddress?.toLowerCase() === schedule.beneficiary.toLowerCase();

  const now = Math.floor(Date.now() / 1000);
  const isVestingFinished = now > Number(schedule.startTime) + Number(schedule.duration);
  const isActive = !schedule.revoked && !isVestingFinished;
  const isReleasable = schedule.releasableAmount > 0n;

  const formatBigIntDate = (ts: bigint) => {
    return new Date(Number(ts) * 1000).toLocaleString(undefined, {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };
  
  const formatDuration = (seconds: bigint) => {
    const days = Number(seconds) / 86400;
    if (days < 1) {
        return "0 days";
    }
    return `${days} days`;
  };

  return (
    <tr className="text-sm">
      <td className="px-4 py-3 font-mono text-xs">{`${schedule.beneficiary.slice(0, 6)}...${schedule.beneficiary.slice(-4)}`}</td>
      <td className="px-4 py-3">{formatUnits(schedule.totalAmount, 18)}</td>
      <td className="px-4 py-3">{formatUnits(schedule.releasedAmount, 18)}</td>
      <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">{formatUnits(schedule.releasableAmount, 18)}</td>
      <td className="px-4 py-3">{formatBigIntDate(schedule.startTime)}</td>
      <td className="px-4 py-3">{formatDuration(schedule.duration)}</td>
      <td className="px-4 py-3">{formatDuration(schedule.cliffDuration)}</td>
      <td className="px-4 py-3">
        {schedule.revoked ? (
          <span className="text-red-500">Revoked</span>
        ) : isVestingFinished ? (
          <span className="text-gray-500">Finished</span>
        ) : (
          <span className="text-green-500">Active</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end space-x-2">
          {isBeneficiary && (
            <Button size="sm" onClick={() => release(schedule.id)} disabled={isLoading || !isReleasable}>
              {isLoading ? <Spinner className="w-4 h-4" /> : "Release"}
            </Button>
          )}
          {schedule.isOwner && schedule.revocable && isActive && (
            <Button size="sm" variant="destructive" onClick={() => revoke(schedule.id)} disabled={isLoading}>
              {isLoading ? <Spinner className="w-4 h-4" /> : "Revoke"}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}