'use client';

import { Address } from 'viem';
import { useEnsName } from 'wagmi';

export const chainSupportsEns = (chainId?: number) =>
  chainId === 1 || chainId === 11155111;

export function useSafeEnsName(address?: Address, currentChainId?: number) {
  const enabled = !!address && chainSupportsEns(currentChainId);

  const { data, isLoading, isFetching, error } = useEnsName({
    address,
    chainId: 1 as any, // force mainnet ENS resolution
    query: { enabled, retry: 0 },
  });

  return {
    ensName: enabled ? data ?? null : null,
    isLoading: enabled && (isLoading || isFetching),
    error: enabled ? error : undefined,
  };
}
