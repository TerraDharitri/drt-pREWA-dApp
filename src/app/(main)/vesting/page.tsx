"use client";

import { useAccount } from "wagmi";
import { ConnectWalletMessage } from "@/components/web3/ConnectWalletMessage";
import CreateVestingSchedule from "@/components/web3/vesting/CreateVestingSchedule";
import { UserVestingSummary } from "@/components/web3/vesting/UserVestingSummary";
import { useIsSafeOwner } from "@/hooks/useIsSafeOwner";
import { Spinner } from "@/components/ui/Spinner";

const inSafeApp = () =>
  typeof window !== "undefined" && window.parent !== window;

export default function VestingPage() {
  const { isConnected } = useAccount();
  const safeMode = inSafeApp();

  const { isOwner, isLoading } = useIsSafeOwner();
  const canShowCreate = safeMode || isOwner;

  return (
    <div className="space-y-8 mt-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Token Vesting</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create and manage vesting schedules for your pREWA tokens.
        </p>
      </div>

      <div className="container mx-auto max-w-5xl px-4 space-y-8">
        {!safeMode && !isConnected ? (
          <ConnectWalletMessage />
        ) : !safeMode && isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Spinner />
          </div>
        ) : (
          <>
            {canShowCreate && <CreateVestingSchedule />}

            {/* First show user's schedules */}
            <UserVestingSummary isAdmin={false} />  
            {/* Then show all protocol schedules */}
            <UserVestingSummary isAdmin={true} />   
          </>
        )}
      </div>
    </div>
  );
}
