// src/lib/providers.ts
import SafeAppsSDK from "@safe-global/safe-apps-sdk";
import { SafeAppProvider } from "@safe-global/safe-apps-provider";
import { BrowserProvider } from "ethers";
import { isSafeApp } from "@/utils/isSafeApp";

export async function getEip1193Provider() {
  const inSafe = await isSafeApp();
  if (inSafe) {
    const appsSdk = new SafeAppsSDK();
    // SafeAppProvider implements EIP-1193 for the connected Safe
    return new SafeAppProvider(await appsSdk.safe.getInfo(), appsSdk) as unknown as {
      request: (args: { method: string; params?: any }) => Promise<any>;
    };
  }

  // fallback: window.ethereum
  if (typeof window !== "undefined" && (window as any).ethereum?.request) {
    return (window as any).ethereum;
  }
  throw new Error("No wallet provider found");
}

// ethers v6 BrowserProvider from EIP-1193
export async function getEthersProvider() {
  const eip1193 = await getEip1193Provider();
  return new BrowserProvider(eip1193 as any);
}
