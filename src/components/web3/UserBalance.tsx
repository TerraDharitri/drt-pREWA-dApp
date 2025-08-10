// src/components/web3/UserBalance.tsx
'use client';

import * as React from 'react';
import { Address, formatUnits } from 'viem';
import { useAccount, useBalance } from 'wagmi';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useSafeEnsName } from '@/hooks/useSafeEnsName';

export function UserBalance({
  userAddress,
}: {
  userAddress?: Address;
}) {
  const { address: connected, chainId } = useAccount();

  const address = userAddress ?? connected ?? undefined;

  const { ensName, isLoading: ensLoading } = useSafeEnsName(
    address,
    chainId
  );

  const { data: native, isLoading: balLoading } = useBalance({
    address,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Address:</div>
          <div className="text-sm font-mono">
            {ensLoading ? (
              <Spinner className="inline-block h-4 w-4" />
            ) : ensName ? (
              ensName
            ) : (
              address ?? '—'
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">BNB:</div>
          <div className="text-sm font-mono">
            {balLoading || !native ? (
              <Spinner className="inline-block h-4 w-4" />
            ) : (
              formatUnits(native.value, native.decimals)
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
