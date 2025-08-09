// src/lib/providerFromConnector.ts
import { ethers } from "ethers";
import type { Connector } from "wagmi";
import { getConnections } from "wagmi/actions";
import { config } from "@/config/wagmi";

/** Returns the active wagmi connector from the singleton config. */
export function getActiveConnector(): Connector {
  const connections = getConnections(config);
  if (!connections.length) {
    throw new Error("No active wallet connections (getConnections returned 0).");
  }
  const active = connections[connections.length - 1];
  if (!active?.connector) {
    throw new Error("Active connection found but connector is missing.");
  }
  return active.connector;
}

/** Get an EIP-1193 provider from the active connector. */
export async function getEip1193FromActiveConnector(): Promise<{
  request: (args: { method: string; params?: any[] | object }) => Promise<any>;
}> {
  const connector = getActiveConnector();
  const provider: any = await connector.getProvider();

  if (!provider || typeof provider.request !== "function") {
    const diag = {
      connectorId: connector.id,
      connectorName: connector.name,
      hasProvider: !!provider,
      providerKeys: provider ? Object.keys(provider) : [],
      typeofRequest: typeof provider?.request,
    };
    throw new Error(
      "Active connector did not yield an EIP-1193 provider with .request: " +
        JSON.stringify(diag)
    );
  }
  return provider;
}

/** (Optional) ethers signer if you ever need it elsewhere */
export async function getEthersSignerFromActiveConnector(
  preferredAddress?: `0x${string}`
) {
  const eip1193 = await getEip1193FromActiveConnector();
  const browserProvider = new ethers.BrowserProvider(eip1193);
  if (preferredAddress) return browserProvider.getSigner(preferredAddress);
  const accounts = (await eip1193.request({ method: "eth_accounts" })) as string[];
  if (!accounts?.length) throw new Error("Provider returned no accounts (eth_accounts).");
  return browserProvider.getSigner(accounts[0] as `0x${string}`);
}
