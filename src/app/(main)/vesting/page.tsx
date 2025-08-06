// src/app/(main)/vesting/page.tsx

"use client";

import { useAccount } from "wagmi";
import { ConnectWalletMessage } from "@/components/web3/ConnectWalletMessage";
import { CreateVestingSchedule } from "@/components/web3/vesting/CreateVestingSchedule";
import { UserVestingSummary } from "@/components/web3/vesting/UserVestingSummary";

export default function VestingPage() {
  const { isConnected } = useAccount();

  return (
    <div className="space-y-8 mt-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Token Vesting</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create and manage vesting schedules for your pREWA tokens.
        </p>
      </div>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {isConnected ? (
          <>
            <CreateVestingSchedule />
            <UserVestingSummary isAdmin={false} />
            <UserVestingSummary isAdmin={true} />
          </>
        ) : (
          <ConnectWalletMessage />
        )}
      </div>
    </div>
  );
}