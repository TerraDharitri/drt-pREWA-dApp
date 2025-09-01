// src/components/web3/liquidity/LiquidityPositionRow.tsx

"use client";
import React from "react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { formatBigInt, formatAddress } from "@/lib/web3-utils";
import { LiquidityPosition } from "@/hooks/useReadLiquidityPositions";
import { TOKEN_LIST_TESTNET } from "@/constants/tokens";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { useReadContracts, useAccount } from "wagmi";
import { isAddressEqual, Address } from "viem";
import { Spinner } from "@/components/ui/Spinner";
import { safeFind, toArray } from "@/utils/safe";


interface LiquidityPositionRowProps {
  position: LiquidityPosition;
}

export function LiquidityPositionRow({ position }: LiquidityPositionRowProps) {
  const { chainId } = useAccount();
  const pREWAAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.pREWAToken : undefined;

  const lpContract = {
      address: position.lpTokenAddress,
      abi: pREWAAbis.IPancakePair,
  } as const;

  const { data: pairData, isLoading } = useReadContracts({
      contracts: [
          { ...lpContract, functionName: 'token0' },
          { ...lpContract, functionName: 'getReserves' },
          { ...lpContract, functionName: 'totalSupply' },
      ],
      query: {
        enabled: !!position.lpTokenAddress,
        refetchInterval: 15000, 
      }
  });

  const [token0AddressResult, reservesResult, lpTotalSupplyResult] = pairData || [];

  const otherTokenInfo = safeFind<typeof TOKEN_LIST_TESTNET[number]>(TOKEN_LIST_TESTNET,(token) => isAddressEqual(token?.address!, position?.otherTokenAddress!));

  const poolName = otherTokenInfo ? `pREWA / ${otherTokenInfo.symbol}` : `pREWA / ${formatAddress(position.otherTokenAddress)}`;

  let tokenABalance = 0n;
  let tokenBBalance = 0n;
  
  // Safely cast the result to a bigint after checking the status.
  const totalSupply = lpTotalSupplyResult?.status === 'success' ? (lpTotalSupplyResult.result as bigint) : 0n;

  if (reservesResult?.status === 'success' && token0AddressResult?.status === 'success' && totalSupply > 0n) {
      const [reserve0, reserve1] = reservesResult.result as [bigint, bigint];
      const userLpBalance = position.currentLpBalance;

      // Now `totalSupply` is correctly typed as a bigint.
      const userShareOfToken0 = (userLpBalance * reserve0) / totalSupply;
      const userShareOfToken1 = (userLpBalance * reserve1) / totalSupply;

      if (pREWAAddress && isAddressEqual(token0AddressResult.result as Address, pREWAAddress)) {
          tokenABalance = userShareOfToken0;
          tokenBBalance = userShareOfToken1;
      } else {
          tokenABalance = userShareOfToken1;
          tokenBBalance = userShareOfToken0;
      }
  }
  
  const tokenADecimals = safeFind<typeof TOKEN_LIST_TESTNET[number]>(TOKEN_LIST_TESTNET, (t) => t?.symbol === "pREWA")?.decimals ?? 18;

  const tokenBDecimals = otherTokenInfo?.decimals ?? 18;

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-4 py-3 font-semibold">{poolName}</td>
      {isLoading ? (
        <td colSpan={3} className="px-4 py-3 text-center"><Spinner /></td>
      ) : (
        <>
            <td className="px-4 py-3 font-mono text-sm">{formatBigInt(tokenABalance, tokenADecimals, 6)}</td>
            <td className="px-4 py-3 font-mono text-sm">{formatBigInt(tokenBBalance, tokenBDecimals, 6)}</td>
            <td className="px-4 py-3 font-mono text-sm">{formatBigInt(position.currentLpBalance, 18, 6)}</td>
        </>
      )}
      <td className="px-4 py-3 text-right">
        <Link href="/liquidity">
          <Button variant="outline" size="sm">Manage</Button>
        </Link>
      </td>
    </tr>
  );
}