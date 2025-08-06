// src/components/web3/staking/StakingPositionCard.tsx

"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { useStaking } from "@/hooks/useStaking";
import { formatBigInt, formatTimestamp } from "@/lib/web3-utils";
import { StakingPositionDetails } from "@/hooks/useReadStakingPositions";

interface StakingPositionCardProps {
  position: StakingPositionDetails;
}

export function StakingPositionCard({ position }: StakingPositionCardProps) {
  const { unstake, claimRewards, isLoading: isActionLoading } = useStaking();
  const [action, setAction] = useState<"unstake" | "claim" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isEnded = position.endTime <= BigInt(Math.floor(Date.now() / 1000));
  const isUnstaking = isActionLoading && action === "unstake";
  const isClaiming = isActionLoading && action === "claim";
  
  const penaltyAmount = isEnded ? 0n : (position.amount * position.earlyWithdrawalPenalty) / 10000n;
  const amountToReceive = position.amount - penaltyAmount;

  const handleConfirmUnstake = () => {
    setAction("unstake");
    // FIX: Convert positionId to string
    unstake(position.positionId.toString());
    setIsModalOpen(false);
  };

  const handleClaim = () => {
    setAction("claim");
    // FIX: Convert positionId to string
    claimRewards(position.positionId.toString());
  };

  return (
    <>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3">
        <div className="flex justify-between items-center">
            <h3 className="font-semibold">Position #{position.positionId.toString()}</h3>
             <span className={`px-2 py-1 text-xs rounded-full ${isEnded ? 'bg-gray-200 text-gray-700' : 'bg-success-100 text-white'}`}>
                {isEnded ? "Ended" : "Staking"}
            </span>
        </div>
        <div className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">{formatBigInt(position.amount)} pREWA</span>
            </div>
             <div className="flex justify-between">
                <span>Tier:</span>
                <span className="font-medium">{position.tierId.toString()}</span>
            </div>
            <div className="flex justify-between">
                <span>End Time:</span>
                <span className="font-medium">{formatTimestamp(position.endTime)}</span>
            </div>
             <div className="flex justify-between">
                <span>Pending Rewards:</span>
                <span className="font-medium text-primary-100">{formatBigInt(position.pendingRewards)} pREWA</span>
            </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
            {isEnded ? (
              <Button onClick={handleConfirmUnstake} variant="primary" size="sm" disabled={isActionLoading}>
                {isUnstaking && <Spinner className="mr-2" />}
                Claim & Unstake
              </Button>
            ) : (
              <>
                <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm" disabled={isActionLoading}>
                  {isUnstaking && <Spinner className="mr-2" />}
                  Unstake
                </Button>
                <Button onClick={handleClaim} variant="primary" size="sm" disabled={isActionLoading || position.pendingRewards === 0n}>
                  {isClaiming && <Spinner className="mr-2" />}
                  Claim Rewards
                </Button>
              </>
            )}
          </div>
      </div>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Early Unstake"
      >
        <div className="space-y-4">
          <p className="text-sm text-greyscale-400">
            You are about to unstake your position before the end date. An early withdrawal penalty will be applied.
          </p>
          <div className="space-y-2 rounded-md border border-input bg-background p-3 text-sm">
            <div className="flex justify-between">
              <span>Original Stake:</span>
              <span className="font-medium">{formatBigInt(position.amount)} pREWA</span>
            </div>
            <div className="flex justify-between text-error-100">
              <span>Penalty ({Number(position.earlyWithdrawalPenalty) / 100}%):</span>
              <span className="font-medium">-{formatBigInt(penaltyAmount)} pREWA</span>
            </div>
            <hr className="border-dashed" />
            <div className="flex justify-between font-bold">
              <span>You will receive:</span>
              <span>{formatBigInt(amountToReceive)} pREWA</span>
            </div>
          </div>
          <p className="text-xs text-greyscale-400">
            Note: Any accrued rewards will also be claimed in this transaction.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmUnstake} disabled={isActionLoading}>
              {isUnstaking && <Spinner className="mr-2" />}
              Confirm Unstake
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}