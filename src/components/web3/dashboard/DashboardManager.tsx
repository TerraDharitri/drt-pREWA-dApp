// src/components/web3/dashboard/DashboardManager.tsx

"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/Card';
import { UserStakingSummary } from '../staking/UserStakingSummary';
import { UserVestingSummary } from '../vesting/UserVestingSummary';
import { UserLiquiditySummary } from '../liquidity/UserLiquiditySummary';
import { UserLPStakingSummary } from '../lp-staking/UserLPStakingSummary';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Spinner } from '@/components/ui/Spinner';

type DashboardTab = "Swap" | "Liquidity" | "Stake" | "LP Staking" | "Vesting" | "Donate";

const PlaceholderCard = ({ message }: { message: string }) => (
    <Card><CardContent><p className="p-4 text-center text-gray-500">{message}</p></CardContent></Card>
);

export function DashboardManager() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("LP Staking");
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [totalPositionCount, setTotalPositionCount] = useState<number | null>(null);

  const renderContent = () => {
    if (isAdminLoading) {
      return (
        <div className="flex items-center justify-center p-8">
            <Spinner />
            <span className="ml-2">Checking permissions...</span>
        </div>
      );
    }

    switch(activeTab) {
      case 'Swap':
        return <PlaceholderCard message="A full swap history requires a dedicated indexing service. This feature is planned for a future update." />;
      case 'Liquidity':
        return <UserLiquiditySummary />;
      case 'Stake':
        return <UserStakingSummary onPositionsLoaded={setTotalPositionCount} />;
      case 'LP Staking':
        return <UserLPStakingSummary />;
      case 'Vesting':
        return <UserVestingSummary isAdmin={!!isAdmin} />;
      case 'Donate':
        return <PlaceholderCard message="A public donation log requires the smart contract to emit events upon receiving donations. This feature can be added in a future contract upgrade." />;
      default:
        return null;
    }
  }

  const tabs: DashboardTab[] = ["Swap", "Liquidity", "Stake", "LP Staking", "Vesting", "Donate"];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800 flex-wrap">
        {tabs.map(tab => (
            <Button 
                key={tab}
                onClick={() => setActiveTab(tab)} 
                variant={activeTab === tab ? 'primary' : 'ghost'} 
                className="flex-grow"
            >
                {tab}
            </Button>
        ))}
      </div>
      <div>
        {renderContent()}
      </div>
    </div>
  );
}