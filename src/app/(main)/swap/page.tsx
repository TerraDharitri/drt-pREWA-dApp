"use client";
import { useAccount } from "wagmi";
import { ConnectWalletMessage } from "@/components/web3/ConnectWalletMessage";
import { SwapCard } from "@/components/web3/swap/SwapCard";

export default function SwapPage() {
  const { isConnected } = useAccount();

  return (
    <div className="space-y-8 mt-20">
      <div className="text-center">
        <h1 className="text-greyscale-900 dark:text-dark-text-primary text-3xl font-bold">
          Swap Tokens
        </h1>
        <p className="text-greyscale-400 dark:text-dark-text-secondary">
          Exchange pREWA and other assets seamlessly.
        </p>
      </div>
      {isConnected ? <SwapCard /> : <ConnectWalletMessage />}
    </div>
  );
}