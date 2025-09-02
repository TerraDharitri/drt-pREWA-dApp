// src/app/(main)/donate/page.tsx

"use client";

import { useAccount } from "wagmi";
import { ConnectWalletMessage } from "@/components/web3/ConnectWalletMessage";
import DonateCard from "@/components/web3/donate/DonateCard";
import { SectionHeader } from "@/components/layout/SectionHeader";
import DonateSummary from "@/components/web3/donate/DonateSummary";

export default function DonatePage() {
  const { isConnected } = useAccount();

  return (
    <div className="space-y-8 mt-4 md:mt-8">
      <SectionHeader
        title="Donate"
        subtitle="Support the ongoing development of the Dharitri Protocol."
      />
      <div className="container mx-auto max-w-5xl px-4">
        {isConnected ? (
          <>
            <DonateCard />
            <DonateSummary />
          </>
        ) : (
          <ConnectWalletMessage />
        )}
      </div>
    </div>
  );
}