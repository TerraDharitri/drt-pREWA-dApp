// src/app/(main)/lp-staking/page.tsx

"use client";
import { useAccount } from "wagmi";
import { ConnectWalletMessage } from "@/components/web3/ConnectWalletMessage";
import { LPStakingDashboard } from "@/components/web3/lp-staking/LPStakingDashboard";
import { UserLPStakingSummary } from "@/components/web3/lp-staking/UserLPStakingSummary"; // Import the summary component

export default function LPStakingPage() {
  const { isConnected } = useAccount();

  return (
    <div className="space-y-8 mt-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Stake LP Tokens</h1>
        <p className="text-gray-600">Lock your LP tokens to earn pREWA rewards.</p>
      </div>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {isConnected ? (
          <>
            <LPStakingDashboard />
            <UserLPStakingSummary />
          </>
        ) : (
          <ConnectWalletMessage />
        )}
      </div>
    </div>
  );
}