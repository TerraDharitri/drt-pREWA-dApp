// src/config/wagmi.ts
import { createConfig, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet, safe } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://prewa.dharitri.org";

export const chains = [bsc, bscTestnet] as const;

export const config = createConfig({
  chains,
  connectors: [
    safe(),
    injected({ target: "metaMask" }),
    coinbaseWallet({ appName: "Dharitri Protocol" }),
    ...(projectId
      ? [
          walletConnect({
            projectId,
            metadata: {
              name: "Dharitri Protocol",
              description: "pREWA vesting & admin",
              url: appUrl,
              icons: [],
            },
            relayUrl: "wss://relay.walletconnect.com",
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
  // FIX: Removed the deprecated 'reconnectOnMount' property.
  // The reconnect logic is correctly handled by the `reconnect()` action in Web3Provider.tsx.
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}