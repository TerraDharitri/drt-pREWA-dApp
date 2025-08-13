// src/app/(main)/stake/page.tsx
"use client";

import { StakingDashboard } from "@/components/web3/staking/StakingDashboard";
import { UserStakingSummary } from "@/components/web3/staking/UserStakingSummary";
import { ConnectWalletMessage } from "@/components/web3/ConnectWalletMessage";
import { useAccount } from "wagmi";
import React from 'react';
import { SectionHeader } from "@/components/layout/SectionHeader";
import { useReadStakingTiers } from "@/hooks/useReadStakingTiers";
import { StakingTierCard } from "@/components/ui/StakingTierCard";
import { Spinner } from "@/components/ui/Spinner";

export default function StakingPage() {
  const { isConnected } = useAccount();
  const [totalPositionCount, setTotalPositionCount] = React.useState<number | null>(null);
  const { tiers, isLoading: isLoadingTiers } = useReadStakingTiers('TokenStaking');
  const [selectedTier, setSelectedTier] = React.useState(0);

  return (
    <div className="space-y-8 mt-4 md:mt-8">
      <SectionHeader
        title="Stake pREWA"
        subtitle="Secure the future, earn rewards. Your stake helps fund farmer services today and the Proof-of-Stake L1 network we’re building."
      />
      <div className="container mx-auto max-w-5xl px-4 space-y-8">
        {!isConnected ? (
          <ConnectWalletMessage />
        ) : (
          <>
            {isLoadingTiers ? (
              <div className="flex justify-center"><Spinner /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tiers.map((tier) => (
                  <StakingTierCard 
                    key={tier.id}
                    tier={tier}
                    isSelected={selectedTier === tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                  />
                ))}
              </div>
            )}
            <StakingDashboard 
                totalPositionCount={totalPositionCount} 
                selectedTierId={selectedTier}
            />
            <UserStakingSummary onPositionsLoaded={setTotalPositionCount} />
          </>
        )}
      </div>
    </div>
  );
}