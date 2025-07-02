"use client";

import { useAccount, useBalance } from "wagmi";
import { pREWAAddresses } from "@/constants";
import { formatBigInt, formatAddress } from "@/lib/web3-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

// CORRECTED: The type for userAddress now uses backticks (` `) for the template literal type.
export function UserBalance({ userAddress }: { userAddress: `0x${string}` }) {
  const { chain } = useAccount();
  const chainId = chain?.id as keyof typeof pREWAAddresses;
  const pREWA_ADDRESS = chainId ? pREWAAddresses[chainId]?.pREWAToken : undefined;

  const { data: ethBalance, isLoading: ethLoading } = useBalance({ address: userAddress });
  const { data: pREWABalance, isLoading: prewaLoading } = useBalance({
    address: userAddress,
    token: pREWA_ADDRESS,
    query: { enabled: !!pREWA_ADDRESS }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Balances</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Address:</span> 
          <span className="font-mono">{formatAddress(userAddress)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{ethBalance?.symbol || 'BNB'}:</span> 
          <span className="font-semibold">{ethLoading ? 'Loading...' : formatBigInt(ethBalance?.value)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{pREWABalance?.symbol || 'pREWA'}:</span> 
          <span className="font-semibold">{prewaLoading ? 'Loading...' : formatBigInt(pREWABalance?.value)}</span>
        </div>
      </CardContent>
    </Card>
  );
}