import type { wagmiConfig } from '@/providers/Web3Provider';

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
