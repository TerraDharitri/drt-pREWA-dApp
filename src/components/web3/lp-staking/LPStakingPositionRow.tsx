// src/components/web3/lp-staking/LPStakingPositionRow.tsx

"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { useLPStaking } from "@/hooks/useLPStaking";
import { formatBigInt, formatTimestamp, formatAddress } from "@/lib/web3-utils"; 
import { LPStakingPositionDetails } from "@/hooks/useReadLPStakingPositions";
import { TOKEN_LIST_TESTNET } from "@/constants/tokens";
import { useReadContracts } from "wagmi";
import { pREWAAbis } from "@/constants";
import { Address, isAddressEqual } from "viem";
import { safeFind, toArray } from "@/utils/safe";


interface LPStakingPositionRowProps {
  position: LPStakingPositionDetails;
}

const BPS_MAX = 10000n;

const getPoolName = (token0: Address | undefined, token1: Address | undefined) => {
    if (!token0 || !token1) return 'Loading Pool...';

    const pREWA = safeFind<typeof TOKEN_LIST_TESTNET[number]>(TOKEN_LIST_TESTNET, (t) => t?.symbol === "pREWA");
    if (!pREWA) return 'Configuration Error';

    const otherTokenAddr = isAddressEqual(token0, pREWA.address) ? token1 : token0;
    const otherTokenInfo = safeFind<typeof TOKEN_LIST_TESTNET[number]>(TOKEN_LIST_TESTNET, (t) => isAddressEqual(t?.address!, otherTokenAddr!));


    return otherTokenInfo ? `pREWA / ${otherTokenInfo.symbol}` : `pREWA / ${formatAddress(otherTokenAddr)}`;
};

export function LPStakingPositionRow({ position }: LPStakingPositionRowProps) {
  const { unstakeLPTokens, claimLPRewards, isLoading: isActionLoading } = useLPStaking();
  const [action, setAction] = useState<"unstake" | "claim" | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: pairTokens } = useReadContracts({
    contracts: [
      { address: position.lpToken, abi: pREWAAbis.IPancakePair, functionName: 'token0' },
      { address: position.lpToken, abi: pREWAAbis.IPancakePair, functionName: 'token1' }
    ],
    query: {
        select: (data) => ({
            token0: data[0].status === 'success' ? data[0].result as Address : undefined,
            token1: data[1].status === 'success' ? data[1].result as Address : undefined,
        })
    }
  });

  const poolName = getPoolName(pairTokens?.token0, pairTokens?.token1);
  const isEnded = position.endTime <= BigInt(Math.floor(Date.now() / 1000));

  const isUnstaking = isActionLoading && action === "unstake";
  const isClaiming = isActionLoading && action === "claim";
  
  const penaltyAmount = isEnded ? 0n : (position.amount * position.earlyWithdrawalPenalty) / BPS_MAX;
  const amountToReceive = position.amount - penaltyAmount;

  const handleConfirmUnstake = () => {
    setAction("unstake");
    unstakeLPTokens(position.positionId);
    setIsModalOpen(false);
  };

  const handleClaim = () => {
    setAction("claim");
    claimLPRewards(position.positionId);
  };

  return (
    <>
      <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <td className="px-4 py-3 font-semibold">{poolName}</td>
        <td className="px-4 py-3 font-mono text-sm">{formatBigInt(position.amount, 18, 6)}</td>
        <td className="px-4 py-3 text-center">{position.tierId.toString()}</td>
        <td className="px-4 py-3">
          {isEnded ? (
            <span className="text-greyscale-400">Ended</span>
          ) : (
            <span className="text-success-100">Staking</span>
          )}
        </td>
        <td className="px-4 py-3">{formatTimestamp(position.startTime)}</td>
        <td className="px-4 py-3">{formatTimestamp(position.endTime)}</td>
        <td className="px-4 py-3 font-semibold text-primary-100">{`${formatBigInt(position.pendingRewards)} pREWA`}</td>
        <td className="px-4 py-3 font-semibold">{`${formatBigInt(position.expectedRewards)} pREWA`}</td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
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
                {/* FIX: Disable claim button if staking has not ended */}
                <Button onClick={handleClaim} variant="primary" size="sm" disabled={isActionLoading || position.pendingRewards === 0n || !isEnded}>
                  {isClaiming && <Spinner className="mr-2" />}
                  Claim Rewards
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Early Unstake"
      >
        <div className="space-y-4">
          <p className="text-sm text-greyscale-400">
            You are about to unstake your LP tokens before the end date. An early withdrawal penalty will be applied.
          </p>
          <div className="space-y-2 rounded-md border border-input bg-background p-3 text-sm">
            <div className="flex justify-between">
              <span>Original Stake:</span>
              <span className="font-medium">{formatBigInt(position.amount, 18, 6)} LP</span>
            </div>
            <div className="flex justify-between text-error-100">
              <span>Penalty ({Number(position.earlyWithdrawalPenalty) / 100}%):</span>
              <span className="font-medium">-{formatBigInt(penaltyAmount, 18, 6)} LP</span>
            </div>
            <hr className="border-dashed" />
            <div className="flex justify-between font-bold">
              <span>You will receive:</span>
              <span>{formatBigInt(amountToReceive, 18, 6)} LP</span>
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