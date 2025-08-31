// src/components/web3/UserBalance.tsx
'use client';

import * as React from 'react';
import { Address, formatUnits } from 'viem';
import { useAccount, useBalance } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useSafeEnsName } from '@/hooks/useSafeEnsName';
import { TOKEN_LISTS, Token } from '@/constants/tokens';
import Image from 'next/image';

// A small component to fetch and display a single token's balance.
const TokenBalanceRow = ({ token }: { token: Token }) => {
  const { address } = useAccount();
  const { data, isLoading } = useBalance({
    address,
    token: token.address,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  return (
    <div className="flex items-center justify-between border-t pt-2 mt-2">
      <div className="text-sm text-gray-500 flex items-center">
        <Image src={token.logoURI} alt={token.symbol} width={20} height={20} className="mr-2 rounded-full" />
        {token.symbol}:
      </div>
      <div className="text-sm font-mono">
        {isLoading || !data ? (
          <Spinner className="inline-block h-4 w-4" />
        ) : (
          parseFloat(formatUnits(data.value, data.decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 })
        )}
      </div>
    </div>
  );
};


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
  
  const tokens = React.useMemo(() => {
    if (!chainId || !TOKEN_LISTS[chainId]) return [];
    return TOKEN_LISTS[chainId].filter(t => t.symbol !== "BNB");
  }, [chainId]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Wallet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Address:</div>
          <div className="text-sm font-mono">
            {ensLoading ? (
              <Spinner className="inline-block h-4 w-4" />
            ) : ensName ? (
              ensName
            ) : (
              address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '—'
            )}
          </div>
        </div>

        {/* FIX: Dynamically display BNB symbol and icon */}
        <div className="flex items-center justify-between border-t pt-2 mt-2">
          <div className="text-sm text-gray-500 flex items-center">
             <Image src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png" alt="BNB Logo" width={20} height={20} className="mr-2 rounded-full" />
            {native?.symbol ?? 'BNB'}:
          </div>
          <div className="text-sm font-mono">
            {balLoading || !native ? (
              <Spinner className="inline-block h-4 w-4" />
            ) : (
              parseFloat(formatUnits(native.value, native.decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 })
            )}
          </div>
        </div>
        
        {tokens.map(token => (
          <TokenBalanceRow key={token.address} token={token} />
        ))}
      </CardContent>
    </Card>
  );
}