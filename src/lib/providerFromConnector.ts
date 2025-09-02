// src/lib/providerFromConnector.ts
import { ethers } from "ethers";
import type { Connector } from "wagmi";
import { getConnections } from "wagmi/actions";
import { config as wagmiConfig } from "@/config/wagmi";

/** Returns the active wagmi connector from the singleton config. */
export function getActiveConnector(): Connector {
  const connections = getConnections(wagmiConfig);
  if (!connections.length) {
    throw new Error("No active wallet connections (getConnections returned 0).");
  }
  const active = connections[connections.length - 1];
  if (!active?.connector) {
    throw new Error("Active connection found but connector is missing.");
  }
  return active.connector;
}

/** EIP-1193 provider from the active connector */
export async function getEip1193FromActiveConnector(): Promise<{
  request: (args: { method: string; params?: any }) => Promise<any>;
}> {
  const connector = getActiveConnector();
  const provider = (await connector.getProvider()) as any;
  if (!provider?.request) {
    throw new Error("Connector returned a provider without .request()");
  }
  return provider;
}

/** (Optional) ethers v6 BrowserProvider if needed elsewhere */
export async function getEthersProviderFromActiveConnector() {
  const eip1193 = await getEip1193FromActiveConnector();
  return new ethers.BrowserProvider(eip1193);
}

/** (Optional) ethers signer from the active connector */
export async function getEthersSignerFromActiveConnector(
  preferredAddress?: `0x${string}`
) {
  const provider = await getEthersProviderFromActiveConnector();
  if (preferredAddress) return provider.getSigner(preferredAddress);
  const accounts = (await provider.send("eth_accounts", [])) as string[];
  if (!accounts?.length) throw new Error("Provider returned no accounts (eth_accounts).");
  return provider.getSigner(accounts[0] as `0x${string}`);
}
