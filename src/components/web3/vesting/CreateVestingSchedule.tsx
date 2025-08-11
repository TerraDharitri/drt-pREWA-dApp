"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import type { Address, Hex } from "viem";
import { encodeFunctionData, parseUnits } from "viem";
import toast from "react-hot-toast";

import { useIsSafeOwner } from "@/hooks/useIsSafeOwner";
import { useSafeProposal } from "@/hooks/useSafeProposal";
import { pREWAAddresses } from "@/constants";

const SECONDS_PER_DAY = 86_400;

// Minimal ABI item for your factory from VestingFactory.json
// function createVesting(address beneficiary, uint256 startTime, uint256 cliffDuration, uint256 duration, bool revocable, uint256 amount)
const vestingFactoryAbi = [
  {
    type: "function",
    name: "createVesting",
    inputs: [
      { name: "beneficiary", type: "address" },
      { name: "startTime", type: "uint256" },
      { name: "cliffDuration", type: "uint256" },
      { name: "duration", type: "uint256" },
      { name: "revocable", type: "bool" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "vestingAddress", type: "address" }],
    stateMutability: "nonpayable",
  },
] as const;

const inSafeApp = () =>
  typeof window !== "undefined" && window.parent !== window;

export default function CreateVestingSchedule() {
  const { chainId } = useAccount();
  const safeMode = inSafeApp();

  const { isOwner, isLoading: isOwnerLoading } = useIsSafeOwner();
  const { proposeTransaction, isProposing } = useSafeProposal();

  // Form state
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState("");           // human amount, e.g. "100"
  const [startDate, setStartDate] = useState("");     // yyyy-mm-dd (native date input)
  const [durationDays, setDurationDays] = useState(""); // string days
  const [cliffDays, setCliffDays] = useState("");       // string days
  const [revocable, setRevocable] = useState(true);

  // Resolve factory address per chain
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
    !durationDays; // cliff optional

  const parseDateToUnix = (value: string) => {
    if (!value) return 0n;
    // value is yyyy-mm-dd from <input type="date">
    const tsMs = Date.parse(`${value}T00:00:00Z`);
    if (Number.isNaN(tsMs)) return 0n;
    return BigInt(Math.floor(tsMs / 1000));
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
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) {
        toast.error("Enter a positive amount.");
        return;
      }

      // Validate and convert days -> seconds
      const durDays = parseInt(durationDays.trim(), 10);
      if (!Number.isFinite(durDays) || durDays < 1) {
        toast.error("Vesting duration must be at least 1 day.");
        return;
      }
      const cliffDaysNum = cliffDays.trim() ? parseInt(cliffDays.trim(), 10) : 0;
      if (!Number.isFinite(cliffDaysNum) || cliffDaysNum < 0) {
        toast.error("Cliff must be a non-negative number of days.");
        return;
      }
      if (cliffDaysNum > durDays) {
        toast.error("Cliff cannot be longer than the total duration.");
        return;
      }

      const durationSecs = BigInt(durDays) * BigInt(SECONDS_PER_DAY);
      const cliffSecs = BigInt(cliffDaysNum) * BigInt(SECONDS_PER_DAY);

      // Optional start date (0 => start now / contract default)
      const startUnix = parseDateToUnix(startDate);
      if (startUnix > 0n) {
        const todayZeroUtc = BigInt(Math.floor(Date.now() / 1000 / SECONDS_PER_DAY) * SECONDS_PER_DAY);
        if (startUnix < todayZeroUtc) {
          toast.error("Start date cannot be in the past.");
          return;
        }
      }

      // pREWA assumed 18 decimals; adjust if not
      const amountWei = parseUnits(amount, 18);

      // Build calldata for factory.createVesting(...)
      const data = encodeFunctionData({
        abi: vestingFactoryAbi as any,
        functionName: "createVesting",
        args: [
          beneficiary as Address,
          startUnix,        // seconds (uint256)
          cliffSecs,        // seconds (uint256)
          durationSecs,     // seconds (uint256)
          revocable,        // bool
          amountWei,        // uint256
        ],
      }) as Hex;

      // Propose to Safe
      await proposeTransaction({
        to: vestingFactoryAddress as Address,
        data,
        value: "0",
      });

      toast.success("Transaction proposed to Safe!");
      // (Optional) clear after success
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