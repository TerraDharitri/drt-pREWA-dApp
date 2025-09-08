// src/components/web3/lp-staking/LPStakingPositionRow.tsx

"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { formatBigInt, formatTimestamp, formatAddress } from "@/lib/web3-utils"; 
import { LPStakingPositionDetails } from "@/hooks/useReadLPStakingPositions";
import { TOKEN_LIST_TESTNET } from "@/constants/tokens";
import { useReadContracts } from "wagmi";
import { pREWAAbis } from "@/constants";
import { Address, isAddressEqual } from "viem";
import { safeFind } from "@/utils/safe";

interface LPStakingPositionRowProps {
  position: LPStakingPositionDetails;
  onClaim: (positionId: bigint) => void;
  onUnstake: (position: LPStakingPositionDetails) => void; // Pass the whole position object
  isLoading: boolean;
  actionPositionId: bigint | null;
}

const getPoolName = (token0: Address | undefined, token1: Address | undefined) => {
    if (!token0 || !token1) return 'Loading Pool...';
    const pREWA = safeFind<typeof TOKEN_LIST_TESTNET[number]>(TOKEN_LIST_TESTNET, (t) => t?.symbol === "pREWA");
    if (!pREWA) return 'Configuration Error';
    const otherTokenAddr = isAddressEqual(token0, pREWA.address) ? token1 : token0;
    const otherTokenInfo = safeFind<typeof TOKEN_LIST_TESTNET[number]>(TOKEN_LIST_TESTNET, (t) => isAddressEqual(t?.address!, otherTokenAddr!));
    return otherTokenInfo ? `pREWA / ${otherTokenInfo.symbol}` : `pREWA / ${formatAddress(otherTokenAddr)}`;
};

export function LPStakingPositionRow({ position, onClaim, onUnstake, isLoading, actionPositionId }: LPStakingPositionRowProps) {
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
  const isActingOnThisRow = isLoading && actionPositionId === position.positionId;

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-4 py-3 font-semibold">{poolName}</td>
      <td className="px-4 py-3 font-mono text-sm">{formatBigInt(position.amount, 18, 6)}</td>
      <td className="px-4 py-3 text-center">{position.tierId.toString()}</td>
      <td className="px-4 py-3">
        {isEnded ? <span className="text-greyscale-400">Ended</span> : <span className="text-success-100">Staking</span>}
      </td>
      <td className="px-4 py-3">{formatTimestamp(position.startTime)}</td>
      <td className="px-4 py-3">{formatTimestamp(position.endTime)}</td>
      <td className="px-4 py-3 font-semibold text-primary-100">{`${formatBigInt(position.pendingRewards)} pREWA`}</td>
      <td className="px-4 py-3 font-semibold">{`${formatBigInt(position.expectedRewards)} pREWA`}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {isEnded ? (
            <Button onClick={() => onUnstake(position)} variant="primary" size="sm" disabled={isLoading}>
              {isActingOnThisRow && <Spinner className="mr-2" />}
              Claim & Unstake
            </Button>
          ) : (
            <>
              <Button onClick={() => onUnstake(position)} variant="outline" size="sm" disabled={isLoading}>
                {isActingOnThisRow && <Spinner className="mr-2" />}
                Unstake
              </Button>
              <Button onClick={() => onClaim(position.positionId)} variant="primary" size="sm" disabled={isLoading || position.pendingRewards === 0n}>
                {isActingOnThisRow && <Spinner className="mr-2" />}
                Claim Rewards
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}