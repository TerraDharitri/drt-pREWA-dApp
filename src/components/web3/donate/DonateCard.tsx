"use client";

import { useEffect, useMemo, useState } from "react";
import type { Address, Hex } from "viem";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, useChainId, usePublicClient, useBalance } from "wagmi";
import toast from "react-hot-toast";

import { useDonate } from "@/hooks/useDonate";
import { pREWAContracts } from "@/contracts/addresses";
import { DonationAbi } from "@/contracts/abis/Donation";
import { TOKEN_ADDRESSES } from "@/contracts/addresses";
import { tokensForChain, type Token } from "@/constants/tokens";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";

type DonationToken = {
  address: Address | null; // null means native BNB
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
};

function isPositiveNumber(input: string): boolean {
  if (!input) return false;
  if (!/^\d*\.?\d*$/.test(input)) return false;
  const n = Number(input);
  return Number.isFinite(n) && n > 0;
}

function buildDonationTokens(chainId: number): DonationToken[] {
  const list = tokensForChain(chainId as 56 | 97);
  const out: DonationToken[] = list.map((t: Token) => ({
    address: t.address as Address,
    symbol: t.symbol,
    name: t.name || t.symbol,
    decimals: t.decimals ?? 18,
    logoURI: t.logoURI,
  }));
  const bnb: DonationToken = { address: null, symbol: "BNB", name: "BNB (native)", decimals: 18, logoURI: "/bnb.svg" };
  // Put BNB on top
  return [bnb, ...out];
}

export default function DonateCard() {
  const { address } = useAccount();
  const chainId = useChainId();
  const pc = usePublicClient({ chainId });
  const { donateNative, donateToken } = useDonate();

  const [amount, setAmount] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  const [tokens, setTokens] = useState<DonationToken[]>(() => buildDonationTokens(chainId));
  const [tokenIndex, setTokenIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [tokenId, setTokenId] = useState<bigint | null>(null);

  const donationContract = (pREWAContracts as Record<number, { Donation?: string }>)[chainId]?.Donation as Address | undefined;
  const explorer = chainId === 56 ? "https://bscscan.com" : "https://testnet.bscscan.com";
  const isAmountValid = useMemo(() => isPositiveNumber(amount), [amount]);
  const fullName = useMemo(() => [firstName, middleName, lastName].filter(Boolean).join(" "), [firstName, middleName, lastName]);
  const fullAddress = useMemo(() => [streetAddress, city, postalCode, country].filter(Boolean).join(", "), [streetAddress, city, postalCode, country]);

  // Donation contract supports ERC-20 donate? (fallback: show anyway)
  const erc20DonateSupported = useMemo(
    () => Array.isArray(DonationAbi) && DonationAbi.some((x: any) => x?.type === "function" && (x?.name === "donateToken" || x?.name === "donateERC20")),
    []
  );

  // keep tokens in sync with chain changes
  useEffect(() => {
    setTokens(buildDonationTokens(chainId));
    setTokenIndex(0);
  }, [chainId]);

  // lazily fill symbol/decimals for selected ERC20
  useEffect(() => {
    (async () => {
      const t = tokens[tokenIndex];
      if (!t || !t.address || (t.decimals && t.symbol)) return;
      try {
        const [sym, dec] = await Promise.all([
          pc?.readContract({ address: t.address, abi: erc20Abi, functionName: "symbol" }),
          pc?.readContract({ address: t.address, abi: erc20Abi, functionName: "decimals" }),
        ]);
        setTokens(prev =>
          prev.map((x, i) => (i === tokenIndex ? { ...x, symbol: typeof sym === "string" ? sym : x.symbol, decimals: Number(dec ?? 18) } : x))
        );
      } catch {
        setTokens(prev => prev.map((x, i) => (i === tokenIndex ? { ...x, decimals: x.decimals ?? 18 } : x)));
      }
    })();
  }, [tokenIndex, tokens, pc]);

  const visibleTokens = useMemo(
    () => tokens.filter((t) => t.address === null || erc20DonateSupported),
    [tokens, erc20DonateSupported]
  );

  useEffect(() => {
    if (tokenIndex >= visibleTokens.length) setTokenIndex(0);
  }, [visibleTokens.length, tokenIndex]);

  async function onDonate() {
    setError(null);
    setEmailMsg(null);
    setTxHash(null);
    setTokenId(null);

    if (!address) {
      setError("Connect a wallet");
      return;
    }
    if (!donationContract) {
      setError("Donation contract not configured for this network");
      return;
    }
    if (!isAmountValid) {
      setError("Enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      const token = visibleTokens[tokenIndex];
      let result: any;

      if (!token || token.address === null) {
        const { parseEther } = await import("viem");
        const wei = parseEther(amount);
        result = await donateNative(wei, fullName, fullAddress);
      } else {
        const { parseUnits } = await import("viem");
        const decimals = token.decimals ?? 18;
        const raw = parseUnits(amount, decimals);
        result = await donateToken(token.address as Address, raw, token.symbol || "TOKEN", decimals, fullName, fullAddress);
      }

      setTxHash(result.txHash);
      if (result.tokenId != null) setTokenId(result.tokenId as bigint);

      if (result.imagePngDataUrl) {
        const a = document.createElement("a");
        a.href = result.imagePngDataUrl;
        a.download = `Dharitri-Certificate-${result.tokenId ?? "donation"}.png`;
        a.click();
      }

      if (email) {
        try {
          const r = await fetch("/api/email-certificate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: email, txHash: result.txHash, tokenId: result.tokenId?.toString() ?? null, pngDataUrl: result.imagePngDataUrl }),
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) setEmailMsg(j?.error ? `Email error: ${j.error}` : `Email API error (${r.status})`);
          else setEmailMsg(j?.id ? `Email queued (id: ${j.id})` : "Email queued");
        } catch (e: any) {
          setEmailMsg(e?.message || "Email request failed");
        }
      }

      toast.success("Donation submitted");
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || "Donation failed");
      toast.error(e?.shortMessage || e?.message || "Donation failed");
    } finally {
      setIsLoading(false);
    }
  }

  // small helpers
  const contractAddress = donationContract;
  const base = chainId === 56 ? "https://bscscan.com" : "https://testnet.bscscan.com";

  // ---- Balance for selected donation asset (BNB/native or ERC-20) ----
  const selectedToken = visibleTokens[tokenIndex];
  const isNative = !selectedToken?.address || selectedToken.address === "0x0000000000000000000000000000000000000000";

  const nativeBal = useBalance({
    address,
    chainId,
    query: { enabled: Boolean(address && chainId && isNative) },
  });

  const tokenBal = useBalance({
    address,
    chainId,
    token: !isNative ? (selectedToken?.address as Address | undefined) : undefined,
    query: { enabled: Boolean(address && chainId && !isNative && selectedToken?.address) },
  });

  const balanceWei: bigint | undefined = isNative ? nativeBal.data?.value : tokenBal.data?.value;
  const balanceFormatted: string = isNative
    ? nativeBal.data?.formatted ?? "0"
    : tokenBal.data?.formatted ?? "0";
  const tokenSymbol = isNative ? "BNB" : (selectedToken?.symbol ?? "TOKEN");
  const hasBalance = (balanceWei ?? 0n) > 0n;

  return (
    <div className="web3-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Directly Fund a Greener Planet</h3>
        <p className="text-xs text-greyscale-400">
          100% of donations are allocated to farmer services, on-chain carbon credit projects, and community grants.
          <br />ONLY to render your certificate on your device and is never stored by us.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="web3-label">Legal First Name *</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Maureen" className="web3-input" />
        </div>
        <div>
          <label className="web3-label">Legal Middle Name</label>
          <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="" className="web3-input" />
        </div>
        <div>
          <label className="web3-label">Legal Last Name *</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Wanjiru" className="web3-input" />
        </div>
      </div>

      <div className="mt-4">
        <label className="web3-label">Street Address *</label>
        <input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="123 Main Street" className="web3-input" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="web3-label">City *</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Anytown" className="web3-input" />
        </div>
        <div>
          <label className="web3-label">Postal Code</label>
          <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="12345" className="web3-input" />
        </div>
      </div>

      <div className="mt-4">
        <label className="web3-label">Country *</label>
        <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Italy" className="web3-input" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="web3-label">Asset</label>
          <select value={tokenIndex} onChange={(e) => setTokenIndex(Number(e.target.value))} className="web3-input">
            {visibleTokens.map((t, i) => (
              <option key={i} value={i}>{t.address === null ? "BNB" : (t.symbol || "TOKEN")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="web3-label">Amount</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className="web3-input" />
          <p className="mt-1 text-xs text-greyscale-500">
            Balance: <span className="font-medium">{balanceFormatted}</span> {tokenSymbol}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label className="web3-label">Email (to receive PDF certificate) — optional</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="web3-input" />
        {emailMsg && <p className="mt-1 text-xs text-greyscale-400">{emailMsg}</p>}
      </div>

      <div className="mt-4">
        <label className="web3-label">Donation Contract</label>
        <div className="flex items-center gap-2">
          <input value={contractAddress ?? ""} readOnly className="web3-input flex-1" />
          {contractAddress && (
            <a className="text-primary-500 underline text-sm" href={`${base}/address/${contractAddress}`} target="_blank" rel="noreferrer">
              View
            </a>
          )}
        </div>
      </div>

      {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}

      <div className="mt-4 text-xs text-greyscale-400">
        {TOKEN_ADDRESSES && (
          <span>
            {/* Supported tokens on this chain: {Object.keys((TOKEN_ADDRESSES as any)[chainId as 56 | 97] || {}).join(", ")} */}
          </span>
        )}
      </div>

      <div className="mt-4">
        {txHash && (
          <div className="text-xs">
            <span className="text-greyscale-500">Last Tx:</span>{" "}
            <a href={`${explorer}/tx/${txHash}`} className="underline" target="_blank" rel="noreferrer">
              {txHash.slice(0, 10)}…{txHash.slice(-8)}
            </a>
          </div>
        )}
      </div>

      <Button onClick={onDonate} disabled={!hasBalance || !isAmountValid || !address || !donationContract || isLoading} className="mt-6 w-full">
        {isLoading ? <><Spinner className="mr-2" /> Processing…</> : "Donate"}
      </Button>

      {!address && <p className="mt-4 text-center text-sm text-greyscale-400">Connect a wallet to donate.</p>}
      {address && !donationContract && <p className="mt-4 text-center text-sm text-red-500">Donation contract is not configured for this network (chain {chainId}).</p>}
    </div>
  );
}