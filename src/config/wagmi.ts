// src/config/wagmi.ts
import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet, safe } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const chains = [bsc, bscTestnet] as const;

export const config = createConfig({
  chains,
  transports: {
    [bsc.id]: http(process.env.NEXT_PUBLIC_BSC_RPC_URL),
    [bscTestnet.id]: http(process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL),
  },
  // IMPORTANT: connectors must be an ARRAY of connector factories (not a function)
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: "Dharitri Protocol" }),
    safe(),
    walletConnect({
      projectId,
      showQrModal: false, // ConnectKit will render the modal
      metadata: {
        name: "Dharitri Protocol",
        description: "Dharitri dApp",
        url:
          typeof window !== "undefined"
            ? window.location.origin
            : "https://prewa.dharitri.org",
        icons: ["https://prewa.dharitri.org/icon.png"],
      },
    }),
  ],
  multiInjectedProviderDiscovery: true,
  storage: createStorage({
    storage: typeof window === "undefined" ? cookieStorage : window.localStorage,
  }),
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
