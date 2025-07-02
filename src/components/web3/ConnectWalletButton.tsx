"use client";

import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/Button';
import { formatAddress } from '@/lib/web3-utils';

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <Button onClick={() => disconnect()} variant="outline">
        {formatAddress(address)}
      </Button>
    );
  }

  // Find the MetaMask connector specifically, or fall back to the first available connector.
  const metaMaskConnector = connectors.find(c => c.id === 'io.metamask');
  const primaryConnector = metaMaskConnector || connectors[0];

  return (
    <Button 
      onClick={() => connect({ connector: primaryConnector })} 
      disabled={isPending}
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}