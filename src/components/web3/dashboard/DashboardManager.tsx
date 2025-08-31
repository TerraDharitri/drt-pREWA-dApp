"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

import { useIsAdmin } from "@/hooks/useAdmin";
import { UserLiquiditySummary } from "../liquidity/UserLiquiditySummary";
import { UserStakingSummary } from "../staking/UserStakingSummary";
import { UserLPStakingSummary } from "../lp-staking/UserLPStakingSummary";
import { UserVestingSummary } from "../vesting/UserVestingSummary";
import { SwapSummary } from "@/components/web3/swap/SwapSummary";
import { DonateSummary } from "@/components/web3/donate/DonateSummary";

type DashboardTab =
  | "Swap"
  | "Liquidity"
  | "Stake"
  | "LP Staking"
  | "Vesting"
  | "Donate";

const PlaceholderCard = ({ message }: { message: string }) => (
  <Card>
    <CardContent>
      <p className="p-4 text-center text-gray-500">{message}</p>
    </CardContent>
  </Card>
);

const DashboardManagerComponent = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("LP Staking");
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [totalPositionCount, setTotalPositionCount] = useState<number | null>(
    null
  );

  const renderContent = () => {
    if (isAdminLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Spinner />
          <span className="ml-2">Checking permissions...</span>
        </div>
      );
    }

    switch (activeTab) {
      case "Swap":
        return <SwapSummary />;
      case "Liquidity":
        return <UserLiquiditySummary />;
      case "Stake":
        return (
          <UserStakingSummary onPositionsLoaded={setTotalPositionCount} />
        );
      case "LP Staking":
        return <UserLPStakingSummary />;
      case "Vesting":
        return <UserVestingSummary isAdmin={!!isAdmin} />;
      case "Donate":
        return <DonateSummary />;
      default:
        return (
          <PlaceholderCard message="Select a section to view your protocol activity." />
        );
    }
  };

  const tabs: DashboardTab[] = [
    // "Swap",
    "Liquidity",
    "Stake",
    "LP Staking",
    "Vesting",
    "Donate", //enable once donattion contracts deployed
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800 flex-wrap">
        {tabs.map((tab) => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            variant={activeTab === tab ? "primary" : "ghost"}
            className="flex-grow"
          >
            {tab}
          </Button>
        ))}
      </div>

      <div>{renderContent()}</div>
    </div>
  );
};

// Export BOTH named and default to avoid import mismatches
export { DashboardManagerComponent as DashboardManager };
export default DashboardManagerComponent;
