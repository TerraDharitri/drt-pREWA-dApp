// src/app/(main)/lp-staking/page.tsx
"use client";

import { LPStakingDashboard } from "@/components/web3/lp-staking/LPStakingDashboard";
import { UserLPStakingSummary } from "@/components/web3/lp-staking/UserLPStakingSummary";
import { ConnectWalletMessage } from "@/components/web3/ConnectWalletMessage";
import { useAccount, useReadContract } from "wagmi";
import React, { useMemo } from 'react';
import { SectionHeader } from "@/components/layout/SectionHeader";
import { useReadStakingTiers } from "@/hooks/useReadStakingTiers";
import { StakingTierCard } from "@/components/ui/StakingTierCard";
import { Spinner } from "@/components/ui/Spinner";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { TOKEN_LISTS } from "@/constants/tokens";
import { Address } from "viem";
import { safeFind, toArray } from "@/utils/safe";


export default function LPStakingPage() {
  const { isConnected, chainId } = useAccount();
  const { tiers, isLoading: isLoadingTiers } = useReadStakingTiers('LPStaking');
  const [selectedTier, setSelectedTier] = React.useState(0);

  // FIX: Fetch the Base APR for the primary pREWA/USDT pool
  const contractAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LPStaking : undefined;
  const pREWA = useMemo( () => safeFind(TOKEN_LISTS[chainId as keyof typeof TOKEN_LISTS], (t: any) => t?.symbol === "pREWA"), [chainId]);
  const USDT = useMemo( () => safeFind(TOKEN_LISTS[chainId as keyof typeof TOKEN_LISTS], (t: any) => t?.symbol === "USDT"), [chainId]);
  const routerAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.PancakeRouter : undefined;

  const { data: factoryAddress } = useReadContract({
      address: routerAddress,
      abi: pREWAAbis.IPancakeRouter,
      functionName: 'factory',
      query: { enabled: !!routerAddress },
  });

  const { data: pairAddress } = useReadContract({
      address: factoryAddress as Address | undefined,
      abi: pREWAAbis.IPancakeFactory,
      functionName: 'getPair',
      args: [pREWA?.address!, USDT?.address!],
      query: { enabled: !!factoryAddress && !!pREWA?.address && !!USDT?.address },
  });

  const { data: poolInfo, isLoading: isLoadingApr } = useReadContract({
      address: contractAddress,
      abi: pREWAAbis.LPStaking,
      functionName: 'getPoolInfo',
      args: [pairAddress as Address],
      query: { enabled: !!contractAddress && !!pairAddress },
  });

  const baseApr = useMemo(() => {
      if (!poolInfo) return 0;
      const [baseAPRBps] = poolInfo as [bigint, bigint, boolean];
      return Number(baseAPRBps) / 100;
  }, [poolInfo]);

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
            {isLoadingTiers || isLoadingApr ? (
              <div className="flex justify-center"><Spinner /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tiers.map((tier) => (
                  <StakingTierCard 
                    key={tier.id}
                    tier={tier}
                    baseApr={baseApr}
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