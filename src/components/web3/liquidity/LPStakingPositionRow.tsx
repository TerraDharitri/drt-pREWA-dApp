"use client";
import React from "react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { formatBigInt, formatTimestamp } from "@/lib/web3-utils";
import { LPStakingPositionDetails } from "@/hooks/useReadLPStakingPositions";
import { TOKEN_LIST_TESTNET } from "@/constants/tokens";
import { useReadContract } from "wagmi";
import { pREWAAbis } from "@/constants";

interface LPStakingPositionRowProps {
  position: LPStakingPositionDetails;
}

export function LPStakingPositionRow({ position }: LPStakingPositionRowProps) {
    
    // To get a user-friendly name, we can find the underlying tokens of the LP token
    const {data: token0} = useReadContract({ address: position.lpToken, abi: pREWAAbis.IPancakePair, functionName: 'token0' });
    const {data: token1} = useReadContract({ address: position.lpToken, abi: pREWAAbis.IPancakePair, functionName: 'token1' });

    const pREWA = TOKEN_LIST_TESTNET.find(t => t.symbol === 'pREWA');
    const otherTokenAddr = token0 === pREWA?.address ? token1 : token0;
    const otherTokenInfo = TOKEN_LIST_TESTNET.find(t => t.address === otherTokenAddr);

    const poolName = otherTokenInfo ? `pREWA / ${otherTokenInfo.symbol}` : 'Unknown Pool';

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-4 py-3 font-semibold">{poolName}</td>
      <td className="px-4 py-3 font-mono text-sm">{formatBigInt(position.amount, 18, 6)}</td>
      <td className="px-4 py-3 text-center">{position.tierId.toString()}</td>
      <td className="px-4 py-3">{formatTimestamp(position.endTime)}</td>
      <td className="px-4 py-3 text-right">
        <Link href="/liquidity">
          <Button variant="outline" size="sm">Manage</Button>
        </Link>
      </td>
    </tr>
  );
}