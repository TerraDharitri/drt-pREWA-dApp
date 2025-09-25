"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Address,
  erc20Abi,
  formatUnits,
  parseEther,
  parseUnits,
} from "viem";
import { useAccount, useChainId, usePublicClient, useBalance } from "wagmi";
import { useDonate } from "@/hooks/useDonate";
import { pREWAContracts } from "@/contracts/addresses";
import { DonationAbi } from "@/contracts/abis/Donation";
import {
  getDonationTokensForChain,
  type DonationToken,
} from "@/contracts/donationTokens";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { safeFind, toArray } from "@/utils/safe";

function isPositiveNumber(input: string): boolean {
  if (!input) return false;
  if (!/^\d*\.?\d*$/.test(input)) return false;
  const n = Number(input);
  return Number.isFinite(n) && n > 0;
}

const DONATION_COMPLIANCE_THRESHOLD = 1000;

export default function DonateCard() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
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
  const [tokens, setTokens] = useState<DonationToken[]>(() => getDonationTokensForChain(chainId));
  const [tokenIndex, setTokenIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [tokenId, setTokenId] = useState<bigint | null>(null);

  const donationContract = (pREWAContracts as Record<number, { Donation?: string }>)[chainId]?.Donation;
  const explorer = chainId === 56 ? "https://bscscan.com" : "https://testnet.bscscan.com";
  const isAmountValid = useMemo(() => isPositiveNumber(amount), [amount]);
  const fullName = useMemo(() => [firstName, middleName, lastName].map((s) => s.trim()).filter(Boolean).join(" "), [firstName, middleName, lastName]);
  const fullAddress = useMemo(() => [streetAddress, city, postalCode, country].map((s) => s.trim()).filter(Boolean).join(", "), [streetAddress, city, postalCode, country]);
  const erc20DonateSupported = useMemo(() => (DonationAbi as ReadonlyArray<any>).some((x) => x?.type === "function" && (x?.name === "donateToken" || x?.name === "donateERC20")), []);

  useEffect(() => {
    setTokens(getDonationTokensForChain(chainId));
    setTokenIndex(0);
  }, [chainId]);

  const visibleTokens = useMemo(() => tokens.filter((t) => t.address === null || erc20DonateSupported), [tokens, erc20DonateSupported]);

  useEffect(() => {
    if (tokenIndex >= visibleTokens.length) setTokenIndex(0);
  }, [visibleTokens.length, tokenIndex]);

  const selectedToken = useMemo(() => visibleTokens[tokenIndex], [visibleTokens, tokenIndex]);

  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
    token: selectedToken?.address ? selectedToken.address as Address : undefined,
    query: {
        enabled: !!address && !!selectedToken,
    },
  });

  const balanceText = useMemo(() => {
    if (balanceData) {
        return `Balance: ${Number(balanceData.formatted).toLocaleString(undefined, {maximumFractionDigits: 8})} ${balanceData.symbol}`;
    }
    return "";
  }, [balanceData]);
  
  const isAmountOverLimit = useMemo(() => {
    if (!isAmountValid || !selectedToken) return false;
    if (selectedToken.symbol === "pREWA") {
      return Number(amount) > DONATION_COMPLIANCE_THRESHOLD;
    }
    return false;
  }, [amount, isAmountValid, selectedToken]);

  // --- MODIFIED: This function now only handles UI state ---
  const handleSuccess = () => {
    setAmount("");
    // The query invalidation in the hook will handle refetching.
    // We can still call refetchBalance() here for an immediate optimistic update if desired,
    // but the global invalidation is more robust.
    refetchBalance(); 
  };

  async function onDonate() {
    setError(null);
    setEmailMsg(null);
    setTxHash(null);
    setTokenId(null);

    if (!address) { setError("Connect a wallet."); return; }
    if (!donationContract) { setError(`Donation contract not configured for chain ${chainId}.`); return; }
    if (!isAmountValid) { setError("Enter a valid positive amount."); return; }
    if (!firstName.trim() || !lastName.trim()) { setError("First & Last name are required for a legal receipt."); return; }
    if (!streetAddress.trim() || !city.trim() || !country.trim()) { setError("A physical address (Street, City, Country) is required for a legal receipt."); return; }

    const token = visibleTokens[tokenIndex];
    if (!token) return;

    try {
      setIsLoading(true);
      let result: Awaited<ReturnType<typeof donateNative>> | Awaited<ReturnType<typeof donateToken>>;

      if (token.address === null) {
        const wei = parseEther(amount);
        result = await donateNative(wei, fullName, fullAddress, { onSuccess: handleSuccess });
      } else {
        const decimals = token.decimals ?? 18;
        const raw = parseUnits(amount, decimals);
        result = await donateToken(token.address as Address, raw, token.symbol || "TOKEN", decimals, fullName, fullAddress, { onSuccess: handleSuccess });
      }

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
            body: JSON.stringify({ to: email, txHash: result.txHash, certificateId: result.tokenId?.toString() ?? null, pngDataUrl: result.imagePngDataUrl }),
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) setEmailMsg(j?.error ? `Email error: ${j.error}` : `Email API error (${r.status})`);
          else setEmailMsg(j?.id ? `Email queued (id: ${j.id})` : "Email queued");
        } catch (e: any) {
          setEmailMsg(e?.message || "Email request failed");
        }
      }

      setTxHash(result.txHash);
      setTokenId(result.tokenId ?? null);
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || "Donation failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyContract() {
    if (!donationContract) return;
    try {
      await navigator.clipboard.writeText(donationContract);
      setEmailMsg("Contract address copied");
      setTimeout(() => setEmailMsg(null), 1500);
    } catch {}
  }

  const buttonText = isLoading 
    ? "Processing…" 
    : isAmountOverLimit 
    ? `Amount exceeds ${DONATION_COMPLIANCE_THRESHOLD} ${selectedToken?.symbol}`
    : "Donate";

  const isButtonDisabled = !isAmountValid || !address || !donationContract || isLoading || isAmountOverLimit;

  return (
    <div className="web3-card mx-auto max-w-2xl p-6 sm:p-8">
        <h3 className="text-xl font-semibold text-greyscale-900 dark:text-dark-text-primary">Directly Fund a Greener Planet</h3>
        <p className="mb-6 mt-1 text-base text-greyscale-400 dark:text-dark-text-secondary">
          100% of donations are allocated to farmer services, on-chain carbon credit projects, and community grants.
          <br />
          <span className="text-sm font-semibold text-warning-200 dark:text-warning-100">
            Note: Your legal name and address are required for a tax-deductible receipt. This information is used ONLY to render your certificate on your device and is never stored by us.
          </span>
        </p>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
                <label className="web3-label">Legal First Name *</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" className="web3-input" />
            </div>
            <div>
                <label className="web3-label">Legal Middle Name</label>
                <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="" className="web3-input" />
            </div>
            <div>
                <label className="web3-label">Legal Last Name *</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className="web3-input" />
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
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United States" className="web3-input" />
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
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.0" className="web3-input" />
            {balanceText && (
              <div className="mt-1 text-xs text-greyscale-400 dark:text-dark-text-secondary">
                {balanceText}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="web3-label">Email (to receive PDF certificate) — optional</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="web3-input" />
        </div>
        
        {donationContract && (
          <div className="mt-4">
            <label className="web3-label">Donation Contract</label>
            <input className="web3-input font-mono !text-sm" readOnly value={donationContract} />
            <button onClick={copyContract} className="mt-1.5 text-sm text-primary-100 hover:underline dark:text-primary-300">
              Copy address
            </button>
          </div>
        )}

        <div className="mt-6 space-y-3">
            {error && <div className="rounded-lg border border-error-100/50 bg-error-0/50 p-3 text-sm text-error-200 dark:bg-error-300/10">{error}</div>}
            {emailMsg && <div className="rounded-lg border border-warning-100/50 bg-warning-0/50 p-3 text-sm text-warning-200 dark:bg-warning-300/10">{emailMsg}</div>}
            {txHash && (
                <div className="rounded-lg border border-success-100/50 bg-success-0/50 p-3 text-sm text-success-200 dark:bg-success-300/10">
                    Donation sent! {tokenId != null && <>Certificate ID: <b>{tokenId.toString()}</b>. </>}
                    Tx:&nbsp;
                    <a className="underline" href={`${explorer}/tx/${txHash}`} target="_blank" rel="noreferrer">
                    {txHash.slice(0, 10)}…{txHash.slice(-8)}
                    </a>
                </div>
            )}
        </div>

        <Button onClick={onDonate} disabled={isButtonDisabled} className="mt-6 w-full" variant="primary" size="lg">
          {isLoading ? <><Spinner className="mr-2" /> Processing…</> : buttonText}
        </Button>

        {!address && <p className="mt-4 text-center text-sm text-greyscale-400">Connect a wallet to donate.</p>}
        {address && !donationContract && <p className="mt-4 text-center text-sm text-greyscale-400">Donation contract is not configured for this network (chain {chainId}).</p>}
    </div>
  );
}