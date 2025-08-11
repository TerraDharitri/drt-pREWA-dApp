"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import type { Address, Hex } from "viem";
import { encodeFunctionData, isAddress, parseUnits } from "viem";
import toast from "react-hot-toast";

import { useIsSafeOwner } from "@/hooks/useIsSafeOwner";
import { useSafeProposal } from "@/hooks/useSafeProposal";
import { pREWAAddresses } from "@/constants";

// ✅ Use the real JSON ABI from your repo
import VestingFactory from "@/contracts/abis/VestingFactory.json";
const vestingFactoryAbi = (VestingFactory as { abi: any }).abi;

const inSafeApp = () =>
  typeof window !== "undefined" && window.parent !== window;

export function CreateVestingSchedule() {
  const { chainId } = useAccount();
  const safeMode = inSafeApp();

  const { isOwner, isLoading: isOwnerLoading } = useIsSafeOwner();
  const { proposeTransaction, isProposing } = useSafeProposal();

  // Form state
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState("");          // human (e.g. "100")
  const [startDate, setStartDate] = useState("");    // from <input type="date" /> -> "YYYY-MM-DD"
  const [durationDays, setDurationDays] = useState("");
  const [cliffDays, setCliffDays] = useState("");
  const [revocable, setRevocable] = useState(true);

  // Resolve contract for the current chain
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
    !durationDays; // cliff can be empty (treated as 0)

  // Convert "YYYY-MM-DD" to unix seconds
  const toUnixStart = (v: string) => {
    if (!v) return 0n;
    const ts = Date.parse(v + "T00:00:00Z");
    return Number.isFinite(ts) ? BigInt(Math.floor(ts / 1000)) : 0n;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!vestingFactoryAddress) {
        toast.error("Unsupported network: VestingFactory not configured.");
        return;
      }
      if (!isAddress(beneficiary)) {
        toast.error("Enter a valid beneficiary address.");
        return;
      }
      if (!amount || Number(amount) <= 0) {
        toast.error("Enter a positive amount.");
        return;
      }

      const duration = parseInt(durationDays || "0", 10);
      if (!Number.isFinite(duration) || duration <= 0) {
        toast.error("Duration (days) must be a positive number.");
        return;
      }

      const cliff = parseInt(cliffDays || "0", 10);
      if (!Number.isFinite(cliff) || cliff < 0) {
        toast.error("Cliff (days) must be zero or a positive number.");
        return;
      }
      if (cliff > duration) {
        toast.error("Cliff cannot be longer than duration.");
        return;
      }

      // If pREWA has non-18 decimals, read & use that value instead.
      const amountWei = parseUnits(amount, 18);

      // ✅ Call the real function with the real ABI and correct arg order
      const data = encodeFunctionData({
        abi: vestingFactoryAbi,
        functionName: "createVesting",
        args: [
          beneficiary as Address,
          toUnixStart(startDate),        // startTime (seconds)
          BigInt(cliff) * 86400n,        // cliffDuration (seconds)
          BigInt(duration) * 86400n,     // duration (seconds)
          revocable,
          amountWei,                     // amount
        ],
      }) as Hex;

      await proposeTransaction({
        to: vestingFactoryAddress,
        data,
        value: "0",
      });

      toast.success("Transaction proposed to Safe.");
      // Optionally reset fields here.
    } catch (err: any) {
      console.error(err);
      toast.error(err?.shortMessage ?? err?.message ?? "Failed to propose");
    }
  };

  // Outside Safe, only owners can see this form
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
        <input
          type="date"
          className="w-full rounded-md border px-3 py-2"
          value={startDate}
          min={new Date().toISOString().slice(0, 10)}
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