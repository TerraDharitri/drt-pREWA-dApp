// src/components/web3/UserBalance.tsx

"use client";

import { useAccount, useBalance } from "wagmi";
import { pREWAAddresses } from "@/constants";
import { formatBigInt, formatAddress } from "@/lib/web3-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Address } from "viem";

export function UserBalance({ userAddress }: { userAddress: Address }) {
  const { chain } = useAccount();
  const chainId = chain?.id as keyof typeof pREWAAddresses;
  const pREWA_ADDRESS = chainId ? pREWAAddresses[chainId]?.pREWAToken : undefined;

  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address: userAddress,
    // FIX: Removed the explicit queryKey
  });

  const { data: pREWABalance, isLoading: prewaLoading } = useBalance({
    address: userAddress,
    token: pREWA_ADDRESS,
    // FIX: Removed the explicit queryKey
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Balances</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-greyscale-400 dark:text-dark-text-secondary">
            Address:
          </span>
          <span className="font-mono">{userAddress ? formatAddress(userAddress) : '...'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-greyscale-400 dark:text-dark-text-secondary">
            {chain?.nativeCurrency.symbol || "BNB"}:
          </span>
          <span className="font-semibold">
            {ethLoading ? "Loading..." : formatBigInt(ethBalance?.value)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-greyscale-400 dark:text-dark-text-secondary">
            {pREWABalance?.symbol || "pREWA"}:
          </span>
          <span className="font-semibold">
            {prewaLoading ? "Loading..." : formatBigInt(pREWABalance?.value)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}