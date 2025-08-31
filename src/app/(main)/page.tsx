// src/app/(main)/page.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAccount } from "wagmi";
import { WalletIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { pREWAContracts } from "@/contracts/addresses";
import { useWatchAsset } from "@/hooks/useWatchAsset";

export default function HomePage() {
  const { chainId } = useAccount();
  const { addTokenToWallet } = useWatchAsset();

  // Determine the correct pREWA token address based on the connected chain
  const prewaTokenAddress = useMemo(() => {
    if (!chainId) return undefined;
    // Check if the chainId is a key in our contracts configuration (e.g., 56 or 97)
    if (chainId in pREWAContracts) {
      return pREWAContracts[chainId as keyof typeof pREWAContracts]?.pREWAToken;
    }
    return undefined;
  }, [chainId]);

  // Handler function to call the wallet
  const handleAddPrewaToWallet = async () => {
    if (!prewaTokenAddress) {
      console.error("No pREWA address found for the current chain.");
      return;
    }
    // The useWatchAsset hook handles the wallet interaction and toasts
    await addTokenToWallet(prewaTokenAddress, "pREWA", 18);
  };

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 md:py-24">
       <SectionHeader 
          title="Finance for a Greener Future."
          subtitle="Stake, swap, and manage pREWA — every action supports farmers with digital IDs, knowledge access, and rewards for sustainable practices."
       />
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/stake">Start Earning</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/liquidity">Fund a Green Pool</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/dashboard">Track Your Impact</Link>
        </Button>
      </div>

      {/* ========== NEW COMPONENT STARTS HERE ========== */}
      <div className="mt-12 w-full max-w-lg rounded-lg border bg-card text-card-foreground shadow-sm p-4 text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-base">Add pREWA to Your Wallet</h3>
              <p className="text-sm text-muted-foreground font-mono break-all mt-1">
                {prewaTokenAddress ? prewaTokenAddress : "Connect to BSC Mainnet or Testnet"}
              </p>
            </div>
            <Button 
              onClick={handleAddPrewaToWallet} 
              disabled={!prewaTokenAddress}
              variant="outline"
              className="w-full sm:w-auto flex-shrink-0"
            >
              <WalletIcon className="mr-2 h-4 w-4" />
              Add Token
            </Button>
          </div>
      </div>
      {/* ========== NEW COMPONENT ENDS HERE ========== */}
    </div>
  );
}