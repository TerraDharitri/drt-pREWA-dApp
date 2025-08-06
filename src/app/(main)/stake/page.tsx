"use client";
import React, { useState } from "react"; // <-- FIX: Add useState import
import { useAccount } from "wagmi";
import { ConnectWalletMessage } from "@/components/web3/ConnectWalletMessage";
import { StakingDashboard } from "@/components/web3/staking/StakingDashboard";
import { UserStakingSummary } from "@/components/web3/staking/UserStakingSummary";

export default function StakePage() {
  const { isConnected } = useAccount();

  // --- FIX: State is now "lifted" to the parent page component ---
  const [totalPositionCount, setTotalPositionCount] = useState<number | null>(null);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 mt-20 px-4">
        <div className="text-center">
          <h1 className="text-greyscale-900 dark:text-dark-text-primary mb-4 text-4xl font-bold">
            Stake pREWA Tokens
          </h1>
          <p className="text-greyscale-400 dark:text-dark-text-secondary text-lg">
            Choose your staking tier and start earning rewards
          </p>
        </div>
        <ConnectWalletMessage />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 mt-20 px-4">
      <div className="text-center">
        <h1 className="text-greyscale-900 dark:text-dark-text-primary mb-4 text-4xl font-bold">
          Stake pREWA Tokens
        </h1>
        <p className="text-greyscale-400 dark:text-dark-text-secondary text-lg">
          Choose your staking tier and start earning rewards
        </p>
      </div>

      {/* FIX: Pass the total position count down to the dashboard */}
      <StakingDashboard 
        totalPositionCount={totalPositionCount} 
      />

      {/* FIX: The summary component will now call this function when it loads positions */}
      <UserStakingSummary 
        onPositionsLoaded={setTotalPositionCount} 
      />
    </div>
  );
}