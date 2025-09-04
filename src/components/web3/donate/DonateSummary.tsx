// src/components/web3/donate/DonateSummary.tsx
"use client";

import React, { useMemo } from "react";
import { useChainId, useAccount } from "wagmi";
import type { Address } from "viem";
import { formatUnits, zeroAddress } from "viem";

import { useDonationHistory } from "@/hooks/useDonationHistory";
import { pREWAContracts } from "@/contracts/addresses";
import { Spinner } from "@/components/ui/Spinner";
import { getDonationTokensForChain, type DonationToken } from "@/contracts/donationTokens";

function explorerBase(chainId?: number) {
  switch (chainId) {
    case 97: return "https://testnet.bscscan.com";
    case 56: return "https://bscscan.com";
    default: return "https://bscscan.com";
  }
}

type RowLike = any;

const DonationTable: React.FC<{
  rows: RowLike[];
  empty: string;
  isLoading: boolean;
  explorerUrl: string;
  contractAddress?: Address;
  tokenMeta: (addr?: Address | null) => { symbol: string; decimals: number };
  visibleRows?: number;
}> = ({ rows, empty, isLoading, explorerUrl, contractAddress, tokenMeta, visibleRows = 5 }) => {
  if (isLoading) {
    return (
      <div className="web3-card mt-2 px-4 py-8 text-center text-sm text-greyscale-400 flex items-center justify-center">
        <Spinner className="mr-2" /> Loading donations…
      </div>
    );
  }
  if (!rows?.length) {
    return <div className="web3-card mt-2 px-4 py-8 text-center text-sm text-greyscale-400">{empty}</div>;
  }

  // Row height is approx 48px (h-12). Table body max height = visibleRows * 48.
  const bodyHeight = visibleRows * 48;

  return (
    <div className="web3-card mt-2 p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-greyscale-100 bg-greyscale-25 dark:border-dark-border dark:bg-dark-surface sticky top-0">
            <tr>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Date (UTC)</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Donor</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Asset</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Amount</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap text-right">Certificate</th>
            </tr>
          </thead>
        </table>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: `${bodyHeight}px` }}>
        <table className="min-w-full text-sm">
          <tbody>
            {rows.map((row: RowLike, i: number) => {
              const tokenAddr: Address | null =
                row?.token === zeroAddress ? null : (row?.token as Address | undefined) ?? null;

              // Get metadata (symbol, decimals) from our reliable local list
              const localMeta = tokenMeta(tokenAddr);
              // Get the symbol that was stored on-chain with the donation record
              const onChainSymbol = row?.symbol;

              // Decide which symbol to display. Prioritize a valid on-chain symbol.
              const displaySymbol = onChainSymbol && onChainSymbol.toUpperCase() !== "TOKEN" ? onChainSymbol : localMeta.symbol;
              // Always use decimals from our local list for consistency
              const decimals = localMeta.decimals;
              
              const ts = Number(row?.timestamp ?? 0) * 1000;
              const tokenId = row?.tokenId ?? row?.nftId ?? row?.certificateId;

              return (
                <tr key={`${row.tx}-${i}`} className="border-t border-greyscale-100/60 dark:border-dark-border h-12">
                  <td className="px-4 py-2 align-middle whitespace-nowrap">
                    {isFinite(ts) && ts > 0 ? new Date(ts).toISOString().slice(0,16).replace('T',' ') : "-"}
                  </td>
                  <td className="px-4 py-2 align-middle font-mono text-xs">
                    {row?.donor}
                  </td>
                  <td className="px-4 py-2 align-middle whitespace-nowrap">{displaySymbol}</td>
                  <td className="px-4 py-2 align-middle whitespace-nowrap">
                    {formatUnits((row?.amount ?? 0n) as bigint, decimals)}
                  </td>
                  <td className="px-4 py-2 align-middle text-right">
                    {tokenId != null ? (
                      <a className="underline text-primary-100 dark:text-primary-300" href={`${explorerUrl}/token/${contractAddress}?a=${String(tokenId)}`} target="_blank" rel="noreferrer">
                        View #{String(tokenId)}
                      </a>
                    ) : (
                      <span className="text-greyscale-500">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export function DonateSummary() {
  const chainId = useChainId();
  const { address } = useAccount();

  const { data: rows = [], isLoading } = useDonationHistory();
  
  const myDonations: RowLike[] = address ? rows.filter(r => r.donor.toLowerCase() === address.toLowerCase()) : [];
  const allDonations: RowLike[] = rows;

  const base = explorerBase(chainId);
  const contractAddress = (pREWAContracts as Record<number, { Donation?: Address }>)[chainId as number]?.Donation;

  const tokenMeta = useMemo(() => {
    const list = getDonationTokensForChain(chainId as 56 | 97);
    const map = new Map<string, { symbol: string; decimals: number }>();
    for (const t of list) {
      if(t.address) map.set(String(t.address).toLowerCase(), { symbol: t.symbol, decimals: t.decimals ?? 18 });
    }
    return (addr?: Address | null) => {
      if (!addr || addr === zeroAddress) return { symbol: "BNB", decimals: 18 };
      const key = String(addr).toLowerCase();
      return map.get(key) || { symbol: "TOKEN", decimals: 18 };
    };
  }, [chainId]);

  return (
    // FIX: Changed grid to a single-column flex layout
    <div className="flex flex-col space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Your Donations</h3>
        <DonationTable
          rows={myDonations}
          isLoading={isLoading}
          explorerUrl={base}
          contractAddress={contractAddress}
          tokenMeta={tokenMeta}
          empty={address ? "You haven't donated yet on this network." : "Connect a wallet to see your donations."}
          visibleRows={5}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold">All Protocol Donations</h3>
        <DonationTable
          rows={allDonations}
          isLoading={isLoading}
          explorerUrl={base}
          contractAddress={contractAddress}
          tokenMeta={tokenMeta}
          empty={contractAddress ? "No protocol donations found yet." : "Donation contract not configured for this network."}
          visibleRows={5}
        />
      </div>
    </div>
  );
}

export default DonateSummary;