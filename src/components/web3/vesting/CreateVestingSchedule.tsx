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

// Your VestingFactory proxy takes createVesting(...) in seconds
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

export default function CreateVestingSchedule() {
  const { chainId } = useAccount();
  const { isOwner, isLoading: isOwnerLoading } = useIsSafeOwner();
  const { proposeTransaction, isProposing, isSafe } = useSafeProposal();

  // --- form state ---
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState(""); // human amount, e.g. "100"
  const [startDate, setStartDate] = useState(""); // <input type="date"> -> "YYYY-MM-DD"
  const [durationDays, setDurationDays] = useState("");
  const [cliffDays, setCliffDays] = useState("");
  const [revocable, setRevocable] = useState(true);

  const vestingFactoryAddress = useMemo(() => {
    if (!chainId) return undefined;
    return pREWAAddresses[chainId as keyof typeof pREWAAddresses]
      ?.VestingFactory as Address | undefined; // **proxy** address
  }, [chainId]);

  const disabled =
    isProposing ||
    isOwnerLoading ||
    !vestingFactoryAddress ||
    !beneficiary ||
    !amount ||
    !durationDays ||
    !cliffDays;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validations
    if (!vestingFactoryAddress) {
      toast.error("Unsupported network: VestingFactory not configured.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(beneficiary)) {
      toast.error("Enter a valid beneficiary address.");
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a positive amount.");
      return;
    }

    // Convert date -> unix (seconds). If empty, 0 means "start now"
    let startUnix = 0;
    if (startDate) {
      // startDate is "YYYY-MM-DD"; interpret as local midnight
      const dt = new Date(`${startDate}T00:00:00`);
      if (Number.isNaN(dt.getTime())) {
        toast.error("Invalid start date.");
        return;
      }
      startUnix = Math.floor(dt.getTime() / 1000);
    }

    const duration = parseInt(durationDays, 10);
    const cliff = parseInt(cliffDays, 10);
    if (!Number.isFinite(duration) || duration <= 0) {
      toast.error("Duration must be at least 1 day.");
      return;
    }
    if (!Number.isFinite(cliff) || cliff < 0) {
      toast.error("Cliff must be a non-negative number of days.");
      return;
    }
    if (cliff > duration) {
      toast.error("Cliff cannot be longer than duration.");
      return;
    }

    // Your pREWA token uses 18 decimals (adjust if different)
    const amountWei = parseUnits(amount, 18);

    // Build calldata for the **proxy** factory
    const data = encodeFunctionData({
      abi: vestingFactoryAbi as any,
      functionName: "createVesting",
      args: [
        beneficiary as Address,
        BigInt(startUnix),
        BigInt(cliff * 86400), // days -> seconds
        BigInt(duration * 86400), // days -> seconds
        revocable,
        amountWei,
      ],
    }) as Hex;

    if (!isSafe) {
      toast.error("Open this page inside your Safe to propose the transaction.");
      return;
    }

    const res = await proposeTransaction({
      to: vestingFactoryAddress as Address, // **proxy**
      data,
      value: "0",
    });

    if (res?.safeTxHash) {
      toast.success("Transaction proposed to your Safe.");
      // Optionally reset the form:
      // setBeneficiary(""); setAmount(""); setStartDate(""); setDurationDays(""); setCliffDays(""); setRevocable(true);
    } else {
      toast.error("Failed to propose transaction. Please try again.");
    }
  };

  // Outside Safe, only owners (signers) should see the form; inside Safe we
  // always allow proposing (it will be confirmed by the Safe policies).
  if (!isSafe && isOwnerLoading) {
    return (
      <div className="rounded-md border p-6 text-center text-sm opacity-70">
        Checking admin permissions…
      </div>
    );
  }
  if (!isSafe && !isOwner) {
    // Not in Safe and not an admin/signer: don’t show form.
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
        {/* native date picker */}
        <input
          className="w-full rounded-md border px-3 py-2"
          type="date"
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
