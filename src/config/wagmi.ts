// src/config/wagmi.ts
import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet, safe } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const chains = [bsc, bscTestnet] as const;

function getAppOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  // Fallback for SSR/build (set your prod domain here as a default)
  return process.env.NEXT_PUBLIC_APP_URL || "https://prewa.dharitri.org";
}

// FIX: Implement the robust, mobile-safe storage strategy.
// This attempts to use cookies, but falls back to a non-persisted, in-memory
// storage if cookies are blocked, preventing the application from crashing.
const safeStorage = (() => {
  try {
    const storage = createStorage({ storage: cookieStorage, key: 'drt-prewa-v1' });
    // Probe the storage to ensure it's actually available
    storage.setItem('__probe', '1');
    storage.removeItem('__probe');
    return storage;
  } catch (error) {
    console.warn("Cookie storage is unavailable, falling back to no-op storage. Wallet connection will not be persisted.", error);
    // If cookies are not available, use a no-op storage so Wagmi never throws.
    return createStorage({
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    });
  }
})();

export const config = createConfig({
  chains,
  // This flag is important for Next.js applications
  ssr: true,
  connectors: [
    // Safe first so it wins inside a Safe iframe
    safe(),
    injected({ target: "metaMask" }),
    coinbaseWallet({ appName: "Dharitri Protocol" }),
    // FIX: Guard WalletConnect initialization and provide a full icon URL
    ...(projectId
      ? [
          walletConnect({
            projectId,
            metadata: {
              name: "Dharitri Protocol",
              description: "pREWA dApp for the Dharitri Foundation",
              url: getAppOrigin(),
              icons: [`${getAppOrigin()}/images/graphics/logo/Dharitri%20Logo%20dark.svg`], // Use a full, valid URL
            },
            relayUrl: "wss://relay.walletconnect.com",
            showQrModal: false, // Let ConnectKit handle the QR modal
          }),
        ]
      : []),
  ],
  transports: {
    [bsc.id]: http(process.env.NEXT_PUBLIC_BSC_RPC_URL),
    [bscTestnet.id]: http(process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL),
  },
  multiInjectedProviderDiscovery: true,
  storage: safeStorage, // Apply the mobile-safe storage
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}