"use client";
import React from 'react';
import { useAccount } from 'wagmi';
import { ConnectWalletMessage } from '@/components/web3/ConnectWalletMessage';
import { LiquidityManagerDashboard } from '@/components/web3/liquidity/LiquidityManagerDashboard';

export default function LiquidityPage() {
  const { isConnected } = useAccount();

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold mb-2">Provide Liquidity</h1>
            <p className="text-gray-600">Add liquidity to pREWA pairs on PancakeSwap to earn fees and support the ecosystem.</p>
        </div>
        {isConnected ? <LiquidityManagerDashboard /> : <ConnectWalletMessage />}
    </div>
  );
}