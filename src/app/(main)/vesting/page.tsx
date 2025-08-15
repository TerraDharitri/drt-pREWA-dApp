// src/app/(main)/vesting/page.tsx
"use client";

import { useAccount } from "wagmi";
import { ConnectWalletMessage } from "@/components/web3/ConnectWalletMessage";
import CreateVestingSchedule from "@/components/web3/vesting/CreateVestingSchedule";
import { UserVestingSummary } from "@/components/web3/vesting/UserVestingSummary";
import { Spinner } from "@/components/ui/Spinner";
import { useIsVestingFactoryOwner } from "@/hooks/useIsVestingFactoryOwner";
import { VestingDashboard } from "@/components/web3/vesting/VestingDashboard";
import { SectionHeader } from "@/components/layout/SectionHeader";

const inSafeApp = () =>
  typeof window !== "undefined" && window.parent !== window;

export default function VestingPage() {
  const { isConnected } = useAccount();
  const safeMode = inSafeApp();

  const { isOwner, isLoading } = useIsVestingFactoryOwner();

  const showAdminUI = isConnected && (safeMode || isOwner);

  // FIX: Define the subtitle dynamically based on the user's role
  const subtitle = isOwner
    ? "Create and manage vesting schedules for your pREWA tokens."
    : "View your pREWA vesting schedules and claim tokens when they become releasable.";

  return (
    <div className="space-y-8 mt-4 md:mt-8">
      <SectionHeader
        title="Token Vesting"
        subtitle={subtitle}
      />

      <div className="container mx-auto max-w-5xl px-4 space-y-8">
        {!isConnected ? (
          <ConnectWalletMessage />
        ) : isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Spinner />
            <span className="ml-2">Checking permissions...</span>
          </div>
        ) : (
          <>
            {showAdminUI && (
              safeMode 
                ? <CreateVestingSchedule />
                : <VestingDashboard />
            )}
            
            {isConnected && <UserVestingSummary isAdmin={false} />}

            <UserVestingSummary isAdmin={true} />
          </>
        )}
      </div>
    </div>
  );
}