"use client";

import React, { useMemo } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { SafeProvider, useSafe } from './SafeProvider';
import { injected } from 'wagmi/connectors';

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!walletConnectProjectId) {
  throw new Error("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set in .env.local");
}

const queryClient = new QueryClient();

const AppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { isSafe, safeProvider } = useSafe();

  const config = useMemo(() => {
    const chains = [bsc, bscTestnet] as const;
    const transports = {
      [bsc.id]: http(),
      [bscTestnet.id]: http(),
    };

    if (isSafe && safeProvider) {
      return createConfig({
        chains,
        connectors: [
          injected({
            target: {
              id: 'safe',
              name: 'Safe',
              provider: safeProvider,
            },
          }),
        ],
        transports,
      });
    }

    return createConfig(
      getDefaultConfig({
        chains,
        transports,
        walletConnectProjectId,
        appName: "Dharitri Protocol",
        appDescription: "Your gateway to staking, swapping, and managing your pREWA assets.",
        // IMPORTANT: Use your production URL here
        appUrl: "https://rewa.dharitri.org", 
        appIcon: "https://rewa.dharitri.org/images/graphics/logo/Dharitri%20Logo%20dark.svg",
      }),
    );
  }, [isSafe, safeProvider]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SafeProvider>
      <AppWithProviders>{children}</AppWithProviders>
    </SafeProvider>
  );
};