// src/components/web3/vesting/CreateVestingSchedule.tsx
"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import type { Address, Hex } from "viem";
import { encodeFunctionData, parseUnits } from "viem";
import toast from "react-hot-toast";

import { useIsSafeOwner } from "@/hooks/useIsSafeOwner";
import { useSafeProposal } from "@/hooks/useSafeProposal";
import { pREWAAddresses } from "@/constants";

const inSafeApp = () =>
  typeof window !== "undefined" && window.parent !== window;

// TODO: Replace this with your real VestingFactory ABI & function name
const vestingFactoryAbi = [
  // example: adjust to your actual ABI signature
  "function createSchedule(address beneficiary,uint256 amount,uint64 start,uint32 durationDays,uint32 cliffDays,bool revocable) external",
] as const;

export function CreateVestingSchedule() {
  const { chainId } = useAccount();
  const safeMode = inSafeApp();

  const { isOwner, isLoading: isOwnerLoading } = useIsSafeOwner();
  const { proposeTransaction, isProposing } = useSafeProposal();

  // Form state
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState(""); // human amount, e.g. "100"
  const [startDate, setStartDate] = useState(""); // dd/mm/yyyy (optional)
  const [durationDays, setDurationDays] = useState("");
  const [cliffDays, setCliffDays] = useState("");
  const [revocable, setRevocable] = useState(true);

  // Resolve contract addresses from your constants per chain
  const vestingFactoryAddress = useMemo(() => {
    if (!chainId) return undefined;
    return pREWAAddresses[chainId as keyof typeof pREWAAddresses]
      ?.VestingFactory as Address | undefined;
  }, [chainId]);

  const disabled =
    isProposing ||
    isOwnerLoading ||
    !vestingFactoryAddress ||
    !beneficiary ||
    !amount ||
    !durationDays ||
    !cliffDays;

  const parseDdMmYyyyToUnix = (value: string) => {
    if (!value) return 0;
    // dd/mm/yyyy -> mm/dd/yyyy for Date parsing
    const normalized = value.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3");
    const ts = Math.floor(new Date(normalized).getTime() / 1000);
    return Number.isFinite(ts) ? ts : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!vestingFactoryAddress) {
        toast.error("Unsupported network: VestingFactory not configured.");
        return;
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(beneficiary)) {
        toast.error("Enter a valid beneficiary address.");
        return;
      }
      if (!amount || Number(amount) <= 0) {
        toast.error("Enter a positive amount.");
        return;
      }

      const startUnix = startDate ? parseDdMmYyyyToUnix(startDate) : 0;
      const duration = parseInt(durationDays || "0", 10);
      const cliff = parseInt(cliffDays || "0", 10);

      // Adjust decimals if pREWA has different decimals than 18
      const amountWei = parseUnits(amount, 18);

      // Build calldata for your factory call
      const data = encodeFunctionData({
        abi: vestingFactoryAbi as any,
        functionName: "createSchedule", // TODO: rename if different
        args: [
          beneficiary as Address,
          amountWei,
          BigInt(startUnix),
          BigInt(duration),
          BigInt(cliff),
          revocable,
        ],
      }) as Hex;

      // ✅ Safe App proposal (single object argument)
      await proposeTransaction({
        to: vestingFactoryAddress as Address,
        data,
        value: "0",
      });

      // Optionally clear form on success
      // setBeneficiary(""); setAmount(""); setStartDate(""); setDurationDays(""); setCliffDays(""); setRevocable(true);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.shortMessage ?? err?.message ?? "Failed to propose");
    }
  };

  // Outside Safe, only owners can see the form
  if (!safeMode && isOwnerLoading) {
    return (
      <div className="rounded-md border p-6 text-center text-sm opacity-70">
        Checking admin permissions…
      </div>
    );
  }
  if (!safeMode && !isOwner) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm mb-1">Beneficiary Address</label>
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="0x..."
          value={beneficiary}
          onChange={(e) => setBeneficiary(e.target.value.trim())}
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Amount to Vest</label>
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="0.0 pREWA"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Start Date (Optional)</label>
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="dd/mm/yyyy"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Duration (Days)</label>
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="e.g., 365"
          inputMode="numeric"
          value={durationDays}
          onChange={(e) => setDurationDays(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Cliff (Days)</label>
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="e.g., 90"
          inputMode="numeric"
          value={cliffDays}
          onChange={(e) => setCliffDays(e.target.value)}
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={revocable}
          onChange={(e) => setRevocable(e.target.checked)}
        />
        Revocable
      </label>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-md bg-neutral-800 text-white py-2 disabled:opacity-50"
      >
        {isProposing ? "Submitting…" : "Propose Vesting Schedule to Safe"}
      </button>
    </form>
  );
}

export default CreateVestingSchedule;
