"use client";
import React from 'react';
import { useAccount } from 'wagmi';
import { ConnectWalletMessage } from '@/components/web3/ConnectWalletMessage';
import { StakingDashboard } from '@/components/web3/staking/StakingDashboard';

export default function StakePage() {
  const { isConnected } = useAccount();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Token Staking</h1>
        <p className="text-gray-600">Stake your pREWA tokens in various tiers to earn rewards.</p>
      </div>
      {isConnected ? <StakingDashboard /> : <ConnectWalletMessage />}
    </div>
  );
}