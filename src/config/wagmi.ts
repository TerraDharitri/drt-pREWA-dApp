// src/config/wagmi.ts
import { createConfig, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet, safe } from "wagmi/connectors"; // ⬅ add 'safe'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const chains = [bsc, bscTestnet] as const;

export const config = createConfig({
  chains,
  connectors: [
    // Safe connector first so it wins inside the Safe iframe
    safe(),                                             // ⬅ new
    injected({ target: "metaMask" }),
    coinbaseWallet({ appName: "Dharitri Protocol" }),
    ...(projectId
      ? [
          walletConnect({
            projectId,
            metadata: {
              name: "Dharitri Protocol",
              description: "pREWA vesting & admin",
              url: "https://prewa.dharitri.org",
              icons: [],
            },
            showQrModal: false,
          }),
        ]
      : []),
  ],
  transports: {
    [bsc.id]: http(process.env.NEXT_PUBLIC_BSC_RPC_URL),
    [bscTestnet.id]: http(process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL),
  },
  multiInjectedProviderDiscovery: true,
});

// TS “Register” remains as you already have
declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
