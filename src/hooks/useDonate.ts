"use client";

import { useAccount, useChainId, usePublicClient, useWriteContract } from "wagmi";
import {
  decodeEventLog,
  encodeAbiParameters,
  formatEther,
  formatUnits,
  keccak256,
  zeroAddress,
  type Address,
  type AbiFunction,
  type Hex,
  parseUnits,
} from "viem";

import { DonationAbi } from "@/contracts/abis/Donation";
import { pREWAContracts } from "@/contracts/addresses";
import { pREWAAbis } from "@/constants";
import { renderSvgToPng } from "@/utils/certificate";
import { TOKEN_LISTS } from "@/constants/tokens";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import toast from "react-hot-toast";

/* --- Certificate org metadata from .env --- */
const ORG_LEGAL_NAME =
  process.env.NEXT_PUBLIC_ORG_LEGAL_NAME?.trim() || "DHARITRI FOUNDATION";
const ORG_REG_NO =
  process.env.NEXT_PUBLIC_ORG_REG_NO?.trim() || "CLG-R6T322W9";
const ORG_ADDRESS =
  process.env.NEXT_PUBLIC_ORG_ADDRESS?.trim() ||
  "P.O BOX 3734 - 00100 - G.P.O NAIROBI; Muthangari Road, Kileleshwa; Dagoreti District, Nairobi, Kenya";
const CERT_SIGNATORY =
  process.env.NEXT_PUBLIC_CERT_SIGNATORY?.trim() || "Authorized Director";

/* --- utils --- */
function short(s: string, head = 6, tail = 4) {
  if (!s) return "";
  return s.length > head + tail + 2 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;
}

function escapeXML(str: string): string {
  if (!str) return "";
  return str.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}

const LOGO_CANDIDATES = ["/dharitri-logo.svg", "/dharitri-logo.png", "/logo.svg", "/logo.png"];

async function fetchAsDataUrl(path: string): Promise<string | undefined> {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return undefined;
    const ct = res.headers.get("content-type") || "";
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);
    const mime = ct || (path.endsWith(".png") ? "image/png" : "image/svg+xml");
    return `data:${mime};base64,${b64}`;
  } catch {
    return undefined;
  }
}

async function loadLogoDataUrl(): Promise<string | undefined> {
  for (const p of LOGO_CANDIDATES) {
    const u = await fetchAsDataUrl(p);
    if (u) return u;
  }
  return undefined;
}

async function qrDataUrl(url: string): Promise<string | undefined> {
  try {
    const QR = await import("qrcode");
    return await QR.default.toDataURL(url, { margin: 1, width: 230 });
  } catch {
    return undefined;
  }
}

async function getAssetPriceAtTime(symbol: string, chainId: number | undefined, publicClient: ReturnType<typeof usePublicClient>): Promise<number | null> {
    if (!publicClient || !chainId) return null;
    const normalizedSymbol = symbol.toUpperCase();

    if (normalizedSymbol === 'PREWA') {
        const tokens = TOKEN_LISTS[chainId as keyof typeof TOKEN_LISTS] || [];
        const usdt = tokens.find((t) => t.symbol === "USDT");
        const prewa = tokens.find((t) => t.symbol === "pREWA");
        const liquidityManager = pREWAContracts[chainId as keyof typeof pREWAContracts]?.LiquidityManager;

        if (usdt && prewa && liquidityManager) {
            try {
                const pairInfo = await publicClient.readContract({ address: liquidityManager as Address, abi: pREWAAbis.ILiquidityManager, functionName: "getPairInfo", args: [usdt.address as Address] });
                const [, , , reserve0, reserve1, pREWAIsToken0] = pairInfo as [Address, Address, boolean, bigint, bigint, boolean, number];
                const prewaRes = pREWAIsToken0 ? reserve0 : reserve1;
                const usdtRes = pREWAIsToken0 ? reserve1 : reserve0;
                const prewaFloat = Number(formatUnits(prewaRes, prewa.decimals));
                const usdtFloat = Number(formatUnits(usdtRes, usdt.decimals));
                if (prewaFloat > 0) return usdtFloat / prewaFloat;
            } catch (e) {
                console.error("Failed to fetch pREWA price from pool:", e);
                return null;
            }
        }
    }

    if (["USDT", "USDC", "DAI"].includes(normalizedSymbol)) return 1.0;

    const symbolToCoinGeckoId: Record<string, string> = { BNB: "binancecoin", TBNB: "binancecoin", ETH: "ethereum", WBTC: "wrapped-bitcoin", LINK: "chainlink", UNI: "uniswap", AAVE: "aave" };
    const coinId = symbolToCoinGeckoId[normalizedSymbol];
    if (!coinId) {
        console.warn(`Price not available for symbol: ${symbol}`);
        return null;
    }

    try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
        if (!res.ok) return null;
        const data = await res.json();
        return data?.[coinId]?.usd ?? null;
    } catch (e) {
        console.error(`Failed to fetch price for ${symbol} from CoinGecko:`, e);
        return null;
    }
}

async function buildCertificateSvg(opts: { orgName: string; orgRegNo: string; orgAddress: string; signatory: string; charityWallet: string; donorWallet: string; donorName: string; donorAddress: string; amountText: string; fmvText: string; dateText: string; chainLabel: string; txHash: `0x${string}`; txUrl: string; tokenId: bigint | number; logoDataUrl?: string; }): Promise<string> {
  const { orgName, orgRegNo, orgAddress, signatory, charityWallet, donorWallet, donorName, donorAddress, amountText, fmvText, dateText, chainLabel, txHash, txUrl, tokenId, logoDataUrl } = opts;
  const safeOrgName = escapeXML(orgName);
  const safeOrgRegNo = escapeXML(orgRegNo);
  const safeOrgAddress = escapeXML(orgAddress);
  const safeDonorName = escapeXML(donorName);
  const safeDonorAddress = escapeXML(donorAddress);
  const safeAmountText = escapeXML(amountText);
  const safeFmvText = escapeXML(fmvText);
  const safeChainLabel = escapeXML(chainLabel);
  const safeSignatory = escapeXML(signatory);
  const qr = (await qrDataUrl(txUrl)) || "";
  const LOGO = logoDataUrl ? `<image href="${logoDataUrl}" x="144" y="144" width="120" height="120" />` : `<g transform="translate(144,144)"><circle cx="60" cy="60" r="60" fill="#DCFCE7"/><text x="60" y="66" font-family="Inter,ui-sans-serif" font-weight="800" font-size="48" text-anchor="middle" fill="#065F46">D</text></g>`;
  const QR = qr ? `<rect x="1210" y="250" width="260" height="260" rx="16" fill="#F0FDF4" stroke="#BBF7D0"/><image href="${qr}" x="1225" y="265" width="230" height="230"/><text x="1340" y="525" font-size="14" text-anchor="middle" fill="#065F46" font-family="Inter,ui-sans-serif">Scan to verify</text>` : ``;
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F8FAF9"/><stop offset="100%" stop-color="#F3F7F5"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#bg)"/><rect x="80" y="80" width="1440" height="740" rx="28" fill="#FFFFFF" stroke="#E6EFE9" stroke-width="2"/>${LOGO}<text x="288" y="174" font-family="Inter,ui-sans-serif" font-weight="800" font-size="36" fill="#0F5132">${safeOrgName}</text><text x="288" y="214" font-family="Inter,ui-sans-serif" font-weight="600" font-size="22" fill="#2B6A4B">Official Donation Receipt</text><text x="288" y="264" font-family="Inter,ui-sans-serif" font-size="16" fill="#475569">Reg / Company No: ${safeOrgRegNo}</text><text x="288" y="288" font-family="Inter,ui-sans-serif" font-size="16" fill="#475569">${safeOrgAddress}</text><text x="144" y="358" font-family="Inter,ui-sans-serif" font-size="18" fill="#475569">Donor</text><text x="144" y="388" font-family="Inter,ui-sans-serif" font-weight="700" font-size="22" fill="#111827">${safeDonorName}</text><text x="144" y="412" font-family="Inter,ui-sans-serif" font-size="16" fill="#475569">${safeDonorAddress}</text><text x="144" y="436" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" font-size="16" fill="#64748B">${short(donorWallet, 8, 8)}</text><text x="144" y="486" font-family="Inter,ui-sans-serif" font-size="18" fill="#475569">Amount</text><text x="144" y="522" font-family="Inter,ui-sans-serif" font-weight="800" font-size="40" fill="#111827">${safeAmountText}</text><text x="144" y="552" font-family="Inter,ui-sans-serif" font-weight="600" font-size="18" fill="#475569">Fair Market Value: ${safeFmvText}</text><text x="144" y="602" font-family="Inter,ui-sans-serif" font-size="18" fill="#475569">Date (UTC)</text><text x="144" y="628" font-family="Inter,ui-sans-serif" font-size="20" fill="#111827">${dateText}</text><text x="400" y="602" font-family="Inter,ui-sans-serif" font-size="18" fill="#475569">Network</text><text x="400" y="628" font-family="Inter,ui-sans-serif" font-size="20" fill="#111827">${safeChainLabel}</text><text x="700" y="602" font-family="Inter,ui-sans-serif" font-size="18" fill="#475569">Certificate ID</text><text x="700" y="628" font-family="Inter,ui-sans-serif" font-size="20" fill="#111827">#${String(tokenId)}</text><text x="144" y="678" font-family="Inter,ui-sans-serif" font-size="18" fill="#475569">Transaction</text><text x="144" y="706" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" font-size="18" fill="#0F766E">${short(txHash, 12, 12)}</text><text x="144" y="730" font-family="Inter,ui-sans-serif" font-size="14" fill="#64748B">${txUrl}</text>${QR}<rect x="1080" y="600" width="360" height="70" rx="10" fill="#F8FAF9" stroke="#E2E8F0"/><text x="1260" y="644" font-family="Inter,ui-sans-serif" font-size="14" text-anchor="middle" fill="#334155">No goods or services were provided in exchange for this donation.</text><line x1="1080" y1="710" x2="1440" y2="710" stroke="#CBD5E1" stroke-width="1"/><text x="1260" y="732" text-anchor="middle" font-family="Inter,ui-sans-serif" font-size="14" fill="#64748B">${safeSignatory}</text><text x="800" y="790" text-anchor="middle" font-family="Inter,ui-sans-serif" font-size="12" fill="#94A3B8">© ${safeOrgName}</text></svg>`;
}

export type DonateResult = { txHash: Hex; tokenId: bigint | null; tokenUri: string | null; imageSvg: string | null; imagePngDataUrl: string | null; };

export function useDonate() {
  const { address: donor } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const { writeContractAsync } = useWriteContract();

  const contractMap = pREWAContracts as Record<number, { Donation?: Address }>;
  const donationAddress = contractMap[chainId]?.Donation as Address | undefined;

  function buildDonateTokenArgs(fn: AbiFunction | undefined, donationHash: Hex, token: Address, amount: bigint): readonly unknown[] {
    if (!fn) throw new Error("donateToken() not present in ABI");
    const inputs = fn.inputs?.map((i) => i.type) ?? [];
    if (inputs[0] === "address" && inputs[1] === "uint256" && inputs[2] === "bytes32") return [token, amount, donationHash] as const;
    if (inputs[0] === "bytes32" && inputs[1] === "address" && inputs[2] === "uint256") return [donationHash, token, amount] as const;
    if (inputs[0] === "address" && inputs[1] === "bytes32" && inputs[2] === "uint256") return [token, donationHash, amount] as const;
    throw new Error(`Unsupported donateToken signature: (${inputs.join(", ")})`);
  }

  async function donateNative(amountWei: bigint, donorName?: string, donorAddressStr?: string): Promise<DonateResult> {
    if (!donor) throw new Error("Connect a wallet");
    if (!donationAddress) throw new Error("Donation contract not configured for this network");
    if (!publicClient) throw new Error("Public client unavailable");

    // FIX: Removed incorrect generic types and let viem infer the return type.
    const nonce = await publicClient.readContract({
        address: donationAddress,
        abi: DonationAbi,
        functionName: "donationNonce",
        args: [donor as Address],
    });

    const donationHash = keccak256(encodeAbiParameters([{ type: "uint256" }, { type: "address" }, { type: "address" }, { type: "uint256" }, { type: "uint256" }], [BigInt(chainId), donor as Address, zeroAddress, amountWei, nonce])) as Hex;
    const txHash = await writeContractAsync({ address: donationAddress, abi: DonationAbi, functionName: "donateNative", args: [donationHash], value: amountWei });
    return await finalize(txHash, donorName, donorAddressStr, amountWei, "BNB", 18);
  }

  const { approve } = useTokenApproval(undefined, donationAddress);

  async function donateToken(token: Address, amount: bigint, tokenSymbol: string, decimals: number, donorName?: string, donorAddressStr?: string): Promise<DonateResult> {
    if (!donor) throw new Error("Connect a wallet");
    if (!donationAddress) throw new Error("Donation contract not configured for this network");
    if (!publicClient) throw new Error("Public client unavailable");

    const doDonation = async () => {
        // FIX: Removed incorrect generic types and let viem infer the return type.
        const nonce = await publicClient.readContract({
            address: donationAddress,
            abi: DonationAbi,
            functionName: "donationNonce",
            args: [donor as Address],
        });
        
        const donationHash = keccak256(encodeAbiParameters([{ type: "uint256" }, { type: "address" }, { type: "address" }, { type: "uint256" }, { type: "uint256" }], [BigInt(chainId), donor as Address, token, amount, nonce])) as Hex;

        let txHash: Hex;
        const donateTokenFn = (DonationAbi as ReadonlyArray<any>).find((x) => x?.type === "function" && x?.name === "donateToken") as AbiFunction | undefined;

        if (donateTokenFn) {
            const args = buildDonateTokenArgs(donateTokenFn, donationHash, token, amount);
            txHash = await writeContractAsync({ address: donationAddress, abi: DonationAbi as any, functionName: "donateToken" as any, args: args as any });
        } else {
            const donateErc20Fn = (DonationAbi as ReadonlyArray<any>).find((x) => x?.type === "function" && x?.name === "donateERC20") as AbiFunction | undefined;
            if (!donateErc20Fn) throw new Error("Neither donateToken nor donateERC20 exists in the provided ABI.");
            const ins = donateErc20Fn.inputs?.map(i => i.type) ?? [];
            let args: readonly unknown[];
            if (ins[0] === "bytes32") args = [donationHash, token, amount] as const;
            else if (ins[2] === "bytes32") args = [token, amount, donationHash] as const;
            else throw new Error(`Unsupported donateERC20 signature: (${ins.join(", ")})`);
            txHash = await writeContractAsync({ address: donationAddress, abi: DonationAbi as any, functionName: "donateERC20" as any, args: args as any });
        }

        return await finalize(txHash, donorName, donorAddressStr, amount, tokenSymbol, decimals, token);
    }
    
    const currentAllowance = await publicClient.readContract({
        address: token,
        abi: [{ type: "function", name: "allowance", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" }] as const,
        functionName: 'allowance',
        args: [donor, donationAddress]
    });

    if (currentAllowance < amount) {
        toast.loading("Requesting approval to spend your " + tokenSymbol);
        await writeContractAsync({
            address: token,
            abi: [{ type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }], }] as const,
            functionName: "approve",
            args: [donationAddress, amount],
        });
        toast.dismiss();
    }
    
    return await doDonation();
  }

  const ERC1155_TRANSFER_SINGLE = [{ type: "event", name: "TransferSingle", inputs: [{ indexed: true,  name: "operator", type: "address" }, { indexed: true,  name: "from",     type: "address" }, { indexed: true,  name: "to",       type: "address" }, { indexed: false, name: "id",       type: "uint256" }, { indexed: false, name: "value",    type: "uint256" }], },] as const;

  async function finalize(txHash: Hex, donorName: string | undefined, donorAddressStr: string | undefined, rawAmount: bigint, symbol: string, decimals: number, tokenAddress?: Address): Promise<DonateResult> {
    const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });
    
    if (receipt.status !== 'success') {
      throw new Error("Transaction failed on-chain. Please check the transaction on BscScan for details.");
    }

    let tokenId: bigint | null = null;
    let ts: number | null = null;

    for (const lg of receipt.logs) {
      const tryNames = ["DonationReceived", "DonationMade", "Donation"];
      let matched = false;
      for (const name of tryNames) {
        try {
          const dec = decodeEventLog({ abi: DonationAbi, data: lg.data as Hex, topics: lg.topics as any });
          if (dec.eventName === name) {
            const a = dec.args as any;
            tokenId = (a.tokenId ?? a.id ?? null) as bigint | null;
            ts = a.timestamp ? Number(a.timestamp) : null;
            matched = true;
            break;
          }
        } catch {}
      }
      if (matched) break;

      try {
        const dec = decodeEventLog({ abi: ERC1155_TRANSFER_SINGLE, data: lg.data as Hex, topics: lg.topics as any });
        if (dec.eventName === "TransferSingle" && (dec.args as any).from?.toLowerCase() === "0x0000000000000000000000000000000000000000") {
          tokenId = (dec.args as any).id as bigint;
          if (lg.blockHash) {
            const blk = await publicClient!.getBlock({ blockHash: lg.blockHash });
            ts = Number(blk.timestamp);
          }
          break;
        }
      } catch {}
    }

    let tokenUri: string | null = null;
    try {
      if (tokenId != null && donationAddress) {
        const result = await publicClient!.readContract({ address: donationAddress, abi: DonationAbi, functionName: "uri", args: [tokenId] });
        tokenUri = result;
      }
    } catch {}

    const isNative = !tokenAddress || tokenAddress === zeroAddress;
    const explorer = chainId === 56 ? "https://bscscan.com" : "https://testnet.bscscan.com";
    const txUrl = `${explorer}/tx/${txHash}`;
    const chainLabel = chainId === 56 ? "BNB Smart Chain" : "BNB Smart Chain Testnet";
    const dateText = (ts ? new Date(ts * 1000) : new Date()).toISOString().slice(0, 10);
    const amountText = isNative
      ? `${Number(formatEther(rawAmount)).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${symbol}`
      : `${Number(formatUnits(rawAmount, decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${symbol}`;
    
    const price = await getAssetPriceAtTime(symbol, chainId, publicClient);
    let fmvText = "N/A";
    if (price) {
      const floatAmount = isNative ? Number(formatEther(rawAmount)) : Number(formatUnits(rawAmount, decimals));
      const fmv = floatAmount * price;
      fmvText = `$${fmv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    }

    const logo = await loadLogoDataUrl();

    const svg = await buildCertificateSvg({
      orgName: ORG_LEGAL_NAME, orgRegNo: ORG_REG_NO, orgAddress: ORG_ADDRESS,
      signatory: CERT_SIGNATORY, charityWallet: donationAddress!, donorWallet: donor!,
      donorName: donorName?.trim() || "Anonymous Donor",
      donorAddress: donorAddressStr?.trim() || "Address Not Provided",
      amountText, fmvText, dateText, chainLabel, txHash, txUrl,
      tokenId: tokenId ?? 0n, logoDataUrl: logo,
    });

    const imagePngDataUrl = await renderSvgToPng(svg, 1600, 900);
    return { txHash, tokenId, tokenUri, imageSvg: svg, imagePngDataUrl };
  }

  return { donateNative, donateToken };
}