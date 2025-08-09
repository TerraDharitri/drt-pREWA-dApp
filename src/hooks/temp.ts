// DEBUG: log owner list from the configured Safe (RPC only)
import { ethers } from "ethers";
import Safe from "@safe-global/protocol-kit";
import { pREWAAddresses } from "@/constants";
import { useEffect } from "react";
import { useAccount } from "wagmi";

function useDebugSafeOwners() {
  const { address, chainId } = useAccount();
  useEffect(() => {
    (async () => {
      try {
        if (!chainId) return;
        const safeAddr = pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.ProtocolAdminSafe as `0x${string}` | undefined;
        if (!safeAddr) return console.debug("[owners] no safe for chain", chainId);
        const rpc = chainId === 56 ? process.env.NEXT_PUBLIC_BSC_RPC_URL : process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL;
        const provider = new ethers.JsonRpcProvider(rpc, chainId);
        const PK: any = Safe as any;
        const safeSdk = typeof PK.init === "function"
          ? await PK.init({ safeAddress: safeAddr, signerOrProvider: provider })
          : await PK.create({ safeAddress: safeAddr, signerOrProvider: provider });
        const owners: string[] = await safeSdk.getOwners();
        console.debug("[owners] chainId:", chainId);
        console.debug("[owners] safe:", safeAddr);
        console.debug("[owners] connected:", address);
        console.debug("[owners] list:", owners);
        console.debug("[owners] match?:", !!owners.find(o => o.toLowerCase() === (address ?? "").toLowerCase()));
      } catch (e) {
        console.error("[owners] failed", e);
      }
    })();
  }, [address, chainId]);
}
