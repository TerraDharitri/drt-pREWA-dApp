"use client";

import React from "react";
import { useChainId, useAccount } from "wagmi";
import { formatUnits, type Address } from "viem";
import { useDonationHistory, type DonationRow } from "@/hooks/useDonationHistory";
import { pREWAContracts } from "@/contracts/addresses"; // FIX: Added missing import
import { Spinner } from "@/components/ui/Spinner";
import { type DonationToken, getDonationTokensForChain } from "@/contracts/donationTokens";
import { zeroAddress } from "viem";
import { safeFind, toArray } from "@/utils/safe";


function explorerBase(chainId?: number) {
  switch (chainId) {
    case 97:
      return "https://testnet.bscscan.com";
    case 56:
      return "https://bscscan.com";
    default:
      return "";
  }
}

const DonationTable: React.FC<{
  rows: DonationRow[];
  empty: string;
  isLoading: boolean;
  explorerUrl: string;
  contractAddress?: Address;
  tokenMeta: (addr?: Address | null) => { symbol: string; decimals: number };
}> = ({ rows, empty, isLoading, explorerUrl, contractAddress, tokenMeta }) => {
  if (isLoading) {
    return (
      <div className="web3-card mt-2 px-4 py-8 text-center text-sm text-greyscale-400 flex items-center justify-center">
        <Spinner className="mr-2" /> Loading...
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="web3-card mt-2 px-4 py-8 text-center text-sm text-greyscale-400">
        {empty}
      </div>
    );
  }

  return (
    <div className="web3-card mt-2 p-0 max-h-[480px] overflow-y-auto relative">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 border-b border-greyscale-100 bg-greyscale-25 dark:border-dark-border dark:bg-dark-surface">
            <tr>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Date (UTC)</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Donor</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Asset</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Amount</th>
              <th className="px-4 py-3 font-semibold whitespace-nowrap text-right">Certificate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const { symbol, decimals } = tokenMeta(r.token);
              const amt = Number(formatUnits(r.amount, decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 });
              const date = new Date(r.timestamp * 1000).toISOString().slice(0, 16).replace("T", " ");

              return (
                <tr key={r.verificationHash} className="border-t border-greyscale-100/60 dark:border-dark-border">
                  <td className="px-4 py-3 whitespace-nowrap">{date}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.donor}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{symbol}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{amt}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <a
                      className="text-primary-100 underline hover:no-underline dark:text-primary-300"
                      href={`${explorerUrl}/token/${contractAddress}?a=${String(r.tokenId)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View #{String(r.tokenId)}
                    </a>
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
  const { address: account } = useAccount();
  const chainId = useChainId();
  const { data: rows = [], isLoading } = useDonationHistory();
  const base = explorerBase(chainId);
  const contractAddress = chainId ? pREWAContracts[chainId as keyof typeof pREWAContracts]?.Donation : undefined;
  const tokens = getDonationTokensForChain(chainId);

  const tokenMeta = (addr?: Address | null) => {
    if (!addr || addr === zeroAddress) return { symbol: "BNB", decimals: 18 };
    const known = safeFind<DonationToken>(tokens, (t) => t?.address?.toLowerCase() === (addr?.toLowerCase() ?? ""));

    return known ? { symbol: known.symbol, decimals: known.decimals ?? 18 } : { symbol: "TOKEN", decimals: 18 };
  };

  const allDonations = rows;
  const yourDonations = account ? rows.filter(r => r.donor.toLowerCase() === account.toLowerCase()) : [];

  return (
    <div className="mx-auto mt-12 w-full max-w-7xl space-y-8">
      <div>
        <h4 className="text-lg font-semibold">Your Donations</h4>
        <DonationTable
          rows={yourDonations}
          isLoading={isLoading}
          explorerUrl={base}
          contractAddress={contractAddress}
          tokenMeta={tokenMeta}
          empty={
            contractAddress
              ? "You haven't donated yet on this network."
              : "Donation contract not configured for this network."
          }
        />
      </div>

      <div>
        <h4 className="text-lg font-semibold">All Protocol Donations</h4>
        <DonationTable
          rows={allDonations}
          isLoading={isLoading}
          explorerUrl={base}
          contractAddress={contractAddress}
          tokenMeta={tokenMeta}
          empty={
            contractAddress
              ? "No protocol donations found yet."
              : "Donation contract not configured for this network."
          }
        />
      </div>
    </div>
  );
}