"use client";
import React, { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { useVestingActions } from "@/hooks/useVestingActions";
import { formatBigInt, formatTimestamp, formatAddress } from "@/lib/web3-utils";
import { VestingScheduleDetails } from "@/hooks/useReadVestingSchedules";
import { Address } from "viem";

interface VestingScheduleRowProps {
  schedule: VestingScheduleDetails;
}

export function VestingScheduleRow({ schedule }: VestingScheduleRowProps) {
  const { address } = useAccount();
  const { releaseVestedTokens, isLoading: isActionLoading } = useVestingActions();
  const [isReleasing, setIsReleasing] = useState(false);

  const isBeneficiary = schedule.beneficiary.toLowerCase() === address?.toLowerCase();

  const handleRelease = () => {
    setIsReleasing(true);
    releaseVestedTokens(schedule.id as Address).finally(() => setIsReleasing(false));
  };

  const status = schedule.revoked 
    ? <span className="text-red-500">Revoked</span> 
    : <span className="text-green-500">Active</span>;

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-4 py-3 font-mono text-sm" title={schedule.beneficiary}>{formatAddress(schedule.beneficiary as Address)}</td>
      <td className="px-4 py-3 font-semibold">{formatBigInt(schedule.totalAmount)}</td>
      <td className="px-4 py-3">{formatBigInt(schedule.releasedAmount)}</td>
      <td className="px-4 py-3 font-semibold text-primary-100">{formatBigInt(schedule.releasableAmount)}</td>
      <td className="px-4 py-3">{formatTimestamp(schedule.startTime)}</td>
      <td className="px-4 py-3">{Number(schedule.duration) / 86400} days</td>
      <td className="px-4 py-3">{status}</td>
      <td className="px-4 py-3 text-right">
        {isBeneficiary && !schedule.revoked && (
          <Button size="sm" onClick={handleRelease} disabled={isActionLoading || schedule.releasableAmount === 0n}>
            {isActionLoading && isReleasing && <Spinner className="mr-2" />}
            Release
          </Button>
        )}
      </td>
    </tr>
  );
}