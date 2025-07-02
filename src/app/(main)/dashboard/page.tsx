"use client";
import { useAccount } from "wagmi";
import { ConnectWalletMessage } from "@/components/web3/ConnectWalletMessage";
import { UserBalance } from "@/components/web3/UserBalance";
import { UserStakingSummary } from "@/components/web3/staking/UserStakingSummary";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return <ConnectWalletMessage />;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Your Personal Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <UserBalance userAddress={address} />
        {/* You can add more summary cards here */}
      </div>
      <hr className="my-8"/>
      <UserStakingSummary />
    </div>
  );
}