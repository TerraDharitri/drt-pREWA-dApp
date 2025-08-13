// src/app/(main)/dashboard/page.tsx
"use client";

import { SectionHeader } from "@/components/layout/SectionHeader";
import { DashboardManager } from "@/components/web3/dashboard/DashboardManager";
import { ConnectWalletMessage } from "@/components/web3/ConnectWalletMessage";
import { UserBalance } from "@/components/web3/UserBalance";
import { useAccount } from "wagmi";
import { ImpactCard } from "@/components/dashboard/ImpactCard";
import { TrustCard } from "@/components/dashboard/TrustCard";

export default function DashboardPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return <ConnectWalletMessage />;
  }

  return (
    <div className="space-y-8 mt-4 md:mt-8">
      <SectionHeader
        title="Dashboard"
        subtitle="Track your portfolio and your impact on the Dharitri ecosystem."
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        <ImpactCard />
        <TrustCard />
      </div>

      <UserBalance />
      <DashboardManager />
    </div>
  );
}