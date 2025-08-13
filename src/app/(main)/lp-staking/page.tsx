// src/app/(main)/lp-staking/page.tsx
"use client";

import { LPStakingDashboard } from "@/components/web3/lp-staking/LPStakingDashboard";
import { UserLPStakingSummary } from "@/components/web3/lp-staking/UserLPStakingSummary";
import { ConnectWalletMessage } from "@/components/web3/ConnectWalletMessage";
import { useAccount } from "wagmi";
import React from 'react';
import { SectionHeader } from "@/components/layout/SectionHeader";
import { useReadStakingTiers } from "@/hooks/useReadStakingTiers";
import { StakingTierCard } from "@/components/ui/StakingTierCard";
import { Spinner } from "@/components/ui/Spinner";

export default function LPStakingPage() {
  const { isConnected } = useAccount();
  const { tiers, isLoading: isLoadingTiers } = useReadStakingTiers('LPStaking');
  const [selectedTier, setSelectedTier] = React.useState(0);

  return (
    <div className="space-y-8 mt-4 md:mt-8">
      <SectionHeader
        title="Stake LP Tokens"
        subtitle="Amplify your impact. Earn additional pREWA rewards on top of trading fees from your LP tokens."
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
            <LPStakingDashboard selectedTierId={selectedTier} />
            <UserLPStakingSummary />
          </>
        )}
      </div>
    </div>
  );
}