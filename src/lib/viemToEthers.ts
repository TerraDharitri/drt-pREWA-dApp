// lib/viemToEthers.ts
import { ethers } from "ethers";
import SafeAppsSDK from "@safe-global/safe-apps-sdk";
import { SafeAppProvider } from "@safe-global/safe-apps-provider";

type Eip1193 = { request: (args: { method: string; params?: any[] | object }) => Promise<any> };

const inSafeApp = () => typeof window !== "undefined" && window.parent !== window;

export async function buildEip1193Provider(walletClient?: any): Promise<Eip1193> {
  // 1) Safe App
  if (inSafeApp()) {
    const sdk = new SafeAppsSDK();
    const safeInfo = await sdk.safe.getInfo();
    const p = new SafeAppProvider(safeInfo, sdk) as unknown as Eip1193;
    if (typeof (p as any)?.request === "function") return p;
    throw new Error("SafeAppProvider did not expose .request()");
  }

  // 2) walletClient.request
  if (walletClient?.request && typeof walletClient.request === "function") {
    return { request: ({ method, params }) => walletClient.request({ method, params }) };
  }

  // 3) walletClient.transport.request
  if (walletClient?.transport?.request && typeof walletClient.transport.request === "function") {
    return { request: ({ method, params }) => walletClient.transport.request({ method, params }) };
  }

  // 4) walletClient.transport.value.request (WalletConnect variants)
  if (walletClient?.transport?.value?.request && typeof walletClient.transport.value.request === "function") {
    return { request: ({ method, params }) => walletClient.transport.value.request({ method, params }) };
  }

  // 5) injected
  const eth = (typeof window !== "undefined" && (window as any).ethereum) || null;
  if (eth?.request && typeof eth.request === "function") return eth as Eip1193;

  // Hard fail with diagnostics (so you know what to fix)
  const diag = {
    inSafeApp: inSafeApp(),
    hasWalletClient: !!walletClient,
    walletClientKeys: walletClient ? Object.keys(walletClient) : [],
    wcRequest: typeof walletClient?.request,
    wcTransReq: typeof walletClient?.transport?.request,
    wcTransValReq: typeof walletClient?.transport?.value?.request,
    hasInjected: !!eth,
    injectedReq: typeof eth?.request,
  };
  throw new Error("No EIP-1193 provider available. Diagnostics: " + JSON.stringify(diag));
}

export async function viemWalletClientToEthersSigner(walletClient?: { account?: { address: `0x${string}` } }) {
  const eip1193 = await buildEip1193Provider(walletClient);
  const provider = new ethers.BrowserProvider(eip1193); // let ethers detect chain

  const preferred = walletClient?.account?.address;
  if (preferred) return provider.getSigner(preferred);

  const accounts = (await eip1193.request({ method: "eth_accounts" })) as string[] | undefined;
  if (!accounts?.length) throw new Error("No accounts returned by provider (eth_accounts)");
  return provider.getSigner(accounts[0] as `0x${string}`);
}
