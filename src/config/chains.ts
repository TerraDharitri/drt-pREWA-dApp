import { bsc, bscTestnet } from 'wagmi/chains';

// Define your application's specific configuration for each chain
export const appChains = {
  [bsc.id]: {
    ...bsc,
    // Add any custom properties if needed, e.g., blockExplorer: '...',
  },
  [bscTestnet.id]: {
    ...bscTestnet,
  },
};

export const supportedChains = Object.values(appChains);