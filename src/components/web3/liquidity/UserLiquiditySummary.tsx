// src/components/web3/liquidity/UserLiquiditySummary.tsx

"use client";
import React from "react";
import Link from 'next/link';
import { useReadLiquidityPositions } from "@/hooks/useReadLiquidityPositions";
import { LiquidityPositionRow } from "./LiquidityPositionRow";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";


export function UserLiquiditySummary() {
  const { positions, isLoading, isError } = useReadLiquidityPositions();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Spinner />
          <span className="ml-2">Loading your liquidity positions...</span>
        </div>
      );
    }

    if (isError) {
      return <p className="p-4 text-center text-error-100">Failed to load liquidity positions.</p>;
    }

    if (positions.length === 0) {
      return (
        <div className="text-center p-4">
            <p className="text-greyscale-400">You have no liquidity positions.</p>
            <Link href="/liquidity" passHref>
                <Button variant="primary" className="mt-4">
                    Add Liquidity
                </Button>
            </Link>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Pool</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Token A (pREWA) Balance</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Token B Balance</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">LP Token Balance</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {positions.map(pos => (
              <LiquidityPositionRow key={pos.id} position={pos} />
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Liquidity Positions ({isLoading ? '...' : positions.length})</CardTitle>
        <CardDescription>
            This section shows the LP tokens you currently hold in your wallet. These tokens represent your share of the liquidity pools and are not currently staked for extra rewards.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}