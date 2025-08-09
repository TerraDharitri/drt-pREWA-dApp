"use client";

import React from "react";
import { useAccount, usePublicClient } from "wagmi";
import type { Address, Hash } from "viem";
import { formatUnits } from "viem";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { pREWAAddresses } from "@/constants";

const NATIVE_DECIMALS = 18;

/** New (tracker) event ABI */
const DONATION_RECEIVED_NEW = [
  {
    type: "event",
    name: "DonationReceived",
    anonymous: false,
    inputs: [
      { indexed: true, name: "donor", type: "address" },
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
      { indexed: false, name: "verificationHash", type: "bytes32" },
      { indexed: false, name: "tokenId", type: "uint256" },
    ],
  },
] as const;

/** Legacy (vault) event ABI */
const DONATION_RECEIVED_OLD = [
  {
    type: "event",
    name: "DonationReceived",
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
  },
] as const;

type DonationRow = {
  hash: Hash;
  blockNumber: bigint;
  from: Address;
  amount: bigint;
  token?: Address;
  timestamp?: number;
};

const narrowChainId = (id?: number) => (id === 56 ? 56 : id === 97 ? 97 : undefined);

const DEPLOY_FROM_BLOCK_56 = Number(process.env.NEXT_PUBLIC_DONATION_DEPLOY_BLOCK_56 || "0");
const DEPLOY_FROM_BLOCK_97 = Number(process.env.NEXT_PUBLIC_DONATION_DEPLOY_BLOCK_97 || "0");
const deployFromBlockFor = (chainId?: number): bigint | undefined => {
  if (chainId === 56 && DEPLOY_FROM_BLOCK_56 > 0) return BigInt(DEPLOY_FROM_BLOCK_56);
  if (chainId === 97 && DEPLOY_FROM_BLOCK_97 > 0) return BigInt(DEPLOY_FROM_BLOCK_97);
  return undefined;
};

export function DonateSummary() {
  const { address: user, chainId } = useAccount();
  const typedChainId = narrowChainId(chainId);
  const client = usePublicClient({ chainId: typedChainId });

  // Prefer DonationTracker (new). Fallback to DonationVault (legacy).
  const networkAddrs: any = chainId ? (pREWAAddresses as any)[chainId] : undefined;
  const donateAddress: Address | undefined =
    (networkAddrs?.DonationTracker as Address | undefined) ??
    (networkAddrs?.DonationVault as Address | undefined);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<DonationRow[]>([]);

  const load = React.useCallback(async () => {
    if (!client || !donateAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const latest = await client.getBlockNumber();
      const deployFrom = deployFromBlockFor(chainId);
      const lookback = 200_000n;
      const fromBlock =
        deployFrom && deployFrom < latest
          ? deployFrom
          : latest > lookback
          ? latest - lookback
          : 1n;

      // Query NEW tracker events (decoded)
      const newLogs = await client.getContractEvents({
        address: donateAddress,
        abi: DONATION_RECEIVED_NEW,
        eventName: "DonationReceived",
        fromBlock,
        toBlock: latest,
      });

      // Query OLD vault events (decoded)
      const oldLogs = await client.getContractEvents({
        address: donateAddress,
        abi: DONATION_RECEIVED_OLD,
        eventName: "DonationReceived",
        fromBlock,
        toBlock: latest,
      });

      const normalized: DonationRow[] = [];

      // Normalize NEW events
      for (const ev of newLogs) {
        const a = ev.args as any;
        normalized.push({
          hash: ev.transactionHash!,
          blockNumber: ev.blockNumber!,
          from: a.donor as Address,
          amount: a.amount as bigint,
          token: a.token as Address,
          timestamp: Number(a.timestamp),
        });
      }

      // Normalize OLD events
      for (const ev of oldLogs) {
        const a = ev.args as any;
        normalized.push({
          hash: ev.transactionHash!,
          blockNumber: ev.blockNumber!,
          from: a.from as Address,
          amount: a.amount as bigint,
          token: undefined,
          timestamp: undefined, // we’ll backfill below
        });
      }

      // Backfill timestamps for old events
      const missingTs = normalized.filter((r) => !r.timestamp);
      if (missingTs.length > 0) {
        const uniqueBlocks = [...new Set(missingTs.map((r) => r.blockNumber))];
        const ts = new Map<bigint, number>();
        for (const bn of uniqueBlocks) {
          try {
            const b = await client.getBlock({ blockNumber: bn });
            ts.set(bn, Number(b.timestamp));
          } catch {
            /* ignore per-block failures */
          }
        }
        for (const r of normalized) {
          if (!r.timestamp) r.timestamp = ts.get(r.blockNumber);
        }
      }

      normalized.sort((a, b) => Number(b.blockNumber - a.blockNumber));
      setRows(normalized);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load donations");
    } finally {
      setIsLoading(false);
    }
  }, [client, donateAddress, chainId]);

  React.useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (!donateAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Donations</CardTitle>
          <CardDescription>
            Donation history will appear once the DonationTracker (or legacy vault) address is configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-gray-500">
          Add <code>DonationTracker</code> (preferred) or <code>DonationVault</code> in your <code>pREWAAddresses</code>.
        </CardContent>
      </Card>
    );
  }

  const yourRows = rows.filter((r) => user && r.from.toLowerCase() === user.toLowerCase());
  const totalAll = rows.reduce((a, r) => a + r.amount, 0n);
  const totalYours = yourRows.reduce((a, r) => a + r.amount, 0n);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Donations</CardTitle>
        <CardDescription>
          On-chain donations received by the protocol {networkAddrs?.DonationTracker ? "tracker" : "vault"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm">
            <Spinner /> Loading donations…
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : (
          <>
            {/* Your donations */}
            <div className="rounded border">
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <div className="font-medium text-sm">Your Donations</div>
                <div className="text-sm opacity-70">
                  Total: {formatUnits(totalYours, NATIVE_DECIMALS)} BNB
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-3 py-2">Block</th>
                      <th className="text-left px-3 py-2">Amount (BNB)</th>
                      <th className="text-left px-3 py-2">Token</th>
                      <th className="text-left px-3 py-2">Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yourRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                          No donations from your address.
                        </td>
                      </tr>
                    ) : (
                      yourRows.slice(0, 10).map((r) => (
                        <tr key={`${r.hash}-${r.blockNumber.toString()}`} className="border-t">
                          <td className="px-3 py-2">{r.blockNumber.toString()}</td>
                          <td className="px-3 py-2">{formatUnits(r.amount, NATIVE_DECIMALS)}</td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {r.token ? `${r.token.slice(0, 6)}…${r.token.slice(-4)}` : "native"}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {r.hash.slice(0, 8)}…{r.hash.slice(-6)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* All donations */}
            <div className="rounded border">
              <div className="flex items-center justify-between px-3 py-2 border-b">
                <div className="font-medium text-sm">All Donations</div>
                <div className="text-sm opacity-70">
                  Total: {formatUnits(totalAll, NATIVE_DECIMALS)} BNB
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-3 py-2">Block</th>
                      <th className="text-left px-3 py-2">From</th>
                      <th className="text-left px-3 py-2">Amount (BNB)</th>
                      <th className="text-left px-3 py-2">Token</th>
                      <th className="text-left px-3 py-2">Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-gray-500">
                          No donations found.
                        </td>
                      </tr>
                    ) : (
                      rows.slice(0, 10).map((r) => (
                        <tr key={`${r.hash}-${r.blockNumber.toString()}`} className="border-t">
                          <td className="px-3 py-2">{r.blockNumber.toString()}</td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {r.from.slice(0, 6)}…{r.from.slice(-4)}
                          </td>
                          <td className="px-3 py-2">{formatUnits(r.amount, NATIVE_DECIMALS)}</td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {r.token ? `${r.token.slice(0, 6)}…${r.token.slice(-4)}` : "native"}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {r.hash.slice(0, 8)}…{r.hash.slice(-6)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
