// src/config/wagmi.ts
import { createConfig, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
if (!projectId) {
  console.warn(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is missing. WalletConnect will be hidden."
  );
}

export const chains = [bsc, bscTestnet] as const;

export const config = createConfig({
  chains,
  connectors: [
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
            // IMPORTANT: let ConnectKit render the QR instead of Reown's modal
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

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
