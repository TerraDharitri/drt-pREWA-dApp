"use client";
import { useAccount } from "wagmi";
import { ConnectWalletMessage } from "@/components/web3/ConnectWalletMessage";
import { UserBalance } from "@/components/web3/UserBalance";
import { DashboardManager } from "@/components/web3/dashboard/DashboardManager";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return (
      <div className="space-y-8 mt-20">
        <div className="text-center">
          <h1 className="text-greyscale-900 dark:text-dark-text-primary text-3xl font-bold">Dashboard</h1>
          <p className="text-greyscale-400 dark:text-dark-text-secondary">Monitor your balances, staking positions, and liquidity pools.</p>
        </div>
        <ConnectWalletMessage />
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-20">
      <div className="text-center">
        <h1 className="text-greyscale-900 dark:text-dark-text-primary mb-2 text-3xl font-bold">Dashboard</h1>
        <p className="text-greyscale-400 dark:text-dark-text-secondary">Monitor your balances, staking positions, and liquidity pools.</p>
      </div>

      <UserBalance userAddress={address} />

      {/* Render the new tabbed dashboard manager */}
      <DashboardManager />
    </div>
  );
}