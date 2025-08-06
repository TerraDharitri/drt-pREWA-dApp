// src/app/(main)/donate/page.tsx

"use client";

import { useAccount } from "wagmi";
import { ConnectWalletMessage } from "@/components/web3/ConnectWalletMessage";
import { DonateCard } from "@/components/web3/donate/DonateCard";

export default function DonatePage() {
  const { isConnected } = useAccount();

  return (
    <div className="space-y-8 mt-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Donate</h1>
        <p className="text-gray-600">Support the ongoing development of the Dharitri Protocol.</p>
      </div>
      {isConnected ? <DonateCard /> : <ConnectWalletMessage />}
    </div>
  );
}