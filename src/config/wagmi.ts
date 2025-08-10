// src/config/wagmi.ts
import { createConfig, createStorage, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const chains = [bsc, bscTestnet] as const;

export const config = createConfig({
  chains,
  // v2: no `autoConnect` here. Use `reconnectOnMount` on <WagmiProvider />.
  connectors: [
    injected({ target: "metaMask", shimDisconnect: true }),
    coinbaseWallet({ appName: "Dharitri Protocol" }), // keep it simple; v2 types are strict
    ...(projectId
      ? [
          walletConnect({
            projectId,
            showQrModal: false, // let your UI handle QR
            relayUrl: "wss://relay.walletconnect.com",
          }),
        ]
      : []),
  ],
  transports: {
    [bsc.id]: http(process.env.NEXT_PUBLIC_BSC_RPC_URL),
    [bscTestnet.id]: http(process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL),
  },
  multiInjectedProviderDiscovery: true,
  storage: createStorage({
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  }),
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
