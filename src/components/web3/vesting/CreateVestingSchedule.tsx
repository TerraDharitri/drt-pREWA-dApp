"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import type { Address, Hex } from "viem";
import { encodeFunctionData, parseUnits } from "viem";
import toast from "react-hot-toast";

import { useIsSafeOwner } from "@/hooks/useIsSafeOwner";
import { useSafeProposal } from "@/hooks/useSafeProposal";
import { pREWAAddresses } from "@/constants";

// ✅ Use the real factory ABI (order: beneficiary, startTime, cliffDuration, duration, revocable, amount)
const vestingFactoryAbi = [
  {
    type: "function",
    name: "createVesting",
    stateMutability: "nonpayable",
    inputs: [
      { name: "beneficiary", type: "address" },
      { name: "startTime", type: "uint256" },
      { name: "cliffDuration", type: "uint256" },
      { name: "duration", type: "uint256" },
      { name: "revocable", type: "bool" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "vestingAddress", type: "address" }],
  },
] as const;

const inSafeApp = () =>
  typeof window !== "undefined" && window.parent !== window;

// helpers
const toSeconds = (days: string) => {
  const d = Number(days || "0");
  return Number.isFinite(d) && d > 0 ? BigInt(Math.floor(d * 86400)) : 0n;
};

const parseDateToUnix = (yyyyMmDd: string): bigint => {
  if (!yyyyMmDd) return 0n;
  // HTML date input gives yyyy-mm-dd
  const ms = Date.parse(yyyyMmDd + "T00:00:00Z");
  return Number.isFinite(ms) ? BigInt(Math.floor(ms / 1000)) : 0n;
};

export default function CreateVestingSchedule() {
  const { chainId } = useAccount();
  const safeMode = inSafeApp();

  const { isOwner, isLoading: isOwnerLoading } = useIsSafeOwner();
  const { proposeTransaction, isProposing } = useSafeProposal();

  // form state
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState("");           // human (e.g. "200")
  const [startDate, setStartDate] = useState("");     // yyyy-mm-dd
  const [durationDays, setDurationDays] = useState("");
  const [cliffDays, setCliffDays] = useState("");
  const [revocable, setRevocable] = useState(true);

  // resolve addresses per chain
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
    !durationDays; // cliff can be 0

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

      const start = parseDateToUnix(startDate);      // 0n allowed (start now)
      const cliffSec = toSeconds(cliffDays);         // days -> seconds
      const durationSec = toSeconds(durationDays);   // days -> seconds

      if (durationSec === 0n) {
        toast.error("Vesting duration must be at least 1 day.");
        return;
      }
      if (cliffSec > durationSec) {
        toast.error("Cliff cannot be longer than the total duration.");
        return;
      }

      // pREWA is 18 decimals – adjust if yours differs
      const amountWei = parseUnits(amount, 18);

      // ✅ Correct function & argument order for your factory
      const data = encodeFunctionData({
        abi: vestingFactoryAbi as any,
        functionName: "createVesting",
        args: [
          beneficiary as Address,
          start,
          cliffSec,
          durationSec,
          revocable,
          amountWei,
        ],
      }) as Hex;

      await proposeTransaction({
        to: vestingFactoryAddress,
        data,          // string '0x…'
        value: "0",
      });

      // optional: clear form
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
  if (!safeMode && !isOwner) return null;

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
        {/* ✅ real date picker (yyyy-mm-dd) */}
        <input
          type="date"
          className="w-full rounded-md border px-3 py-2"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Duration (Days)</label>
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="e.g., 8"
          inputMode="numeric"
          value={durationDays}
          onChange={(e) => setDurationDays(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Cliff (Days)</label>
        <input
          className="w-full rounded-md border px-3 py-2"
          placeholder="e.g., 1"
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