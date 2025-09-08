// src/components/web3/lp-staking/UserLPStakingSummary.tsx

"use client";
import React, { useState } from "react";
import { useReadLPStakingPositions, LPStakingPositionDetails } from "@/hooks/useReadLPStakingPositions";
import { LPStakingPositionRow } from "./LPStakingPositionRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { useLPStaking } from "@/hooks/useLPStaking";
import { formatBigInt } from "@/lib/web3-utils";

const BPS_MAX = 10000n;

export function UserLPStakingSummary() {
  const { positions, isLoading: isLoadingPositions } = useReadLPStakingPositions();
  const { unstakeLPTokens, claimLPRewards, isLoading: isActionLoading } = useLPStaking();
  
  const [modalPosition, setModalPosition] = useState<LPStakingPositionDetails | null>(null);
  const [actionPositionId, setActionPositionId] = useState<bigint | null>(null);

  const activePositions = positions.filter(p => p.active && p.amount > 0n);

  const handleClaim = (positionId: bigint) => {
    setActionPositionId(positionId);
    claimLPRewards(positionId);
  };

  const handleUnstakeClick = (position: LPStakingPositionDetails) => {
    setActionPositionId(position.positionId);
    const isEnded = position.endTime <= BigInt(Math.floor(Date.now() / 1000));
    if (isEnded) {
      unstakeLPTokens(position.positionId); // No modal if already ended
    } else {
      setModalPosition(position); // Open modal for early unstake confirmation
    }
  };

  const handleConfirmUnstake = () => {
    if (modalPosition) {
      unstakeLPTokens(modalPosition.positionId);
      setModalPosition(null);
    }
  };

  const penaltyAmount = modalPosition ? (modalPosition.amount * modalPosition.earlyWithdrawalPenalty) / BPS_MAX : 0n;
  const amountToReceive = modalPosition ? modalPosition.amount - penaltyAmount : 0n;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Staked Liquidity Positions ({activePositions.length})</CardTitle>
        </CardHeader>
        <CardContent>
           {isLoadingPositions ? (
              <div className="flex items-center justify-center p-8">
                <Spinner /><span className="ml-2">Loading your staked liquidity positions...</span>
              </div>
           ) : activePositions.length === 0 ? (
             <p className="p-4 text-center text-greyscale-400">You have no active LP staking positions.</p>
           ) : (
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
                    <LPStakingPositionRow 
                      key={pos.positionId.toString()} 
                      position={pos} 
                      onClaim={handleClaim}
                      onUnstake={handleUnstakeClick}
                      isLoading={isActionLoading}
                      actionPositionId={actionPositionId}
                    />
                  ))}
                </tbody>
              </table>
            </div>
           )}
        </CardContent>
      </Card>

      {modalPosition && (
        <Modal isOpen={!!modalPosition} onClose={() => setModalPosition(null)} title="Confirm Early Unstake">
          <div className="space-y-4">
            <p className="text-sm text-greyscale-400">You are about to unstake your LP tokens before the end date. An early withdrawal penalty will be applied.</p>
            <div className="space-y-2 rounded-md border border-input bg-background p-3 text-sm">
              <div className="flex justify-between"><span>Original Stake:</span><span className="font-medium">{formatBigInt(modalPosition.amount, 18, 6)} LP</span></div>
              <div className="flex justify-between text-error-100"><span>Penalty ({Number(modalPosition.earlyWithdrawalPenalty) / 100}%):</span><span className="font-medium">-{formatBigInt(penaltyAmount, 18, 6)} LP</span></div>
              <hr className="border-dashed" />
              <div className="flex justify-between font-bold"><span>You will receive:</span><span>{formatBigInt(amountToReceive, 18, 6)} LP</span></div>
            </div>
            <p className="text-xs text-greyscale-400">Note: Any accrued rewards will also be claimed in this transaction.</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setModalPosition(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmUnstake} disabled={isActionLoading}>
                {isActionLoading && <Spinner className="mr-2" />}
                Confirm Unstake
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}