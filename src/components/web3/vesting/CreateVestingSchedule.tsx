// src/components/web3/vesting/CreateVestingSchedule.tsx
"use client";

import { useMemo, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import type { Address, Hex } from "viem";
import { encodeFunctionData, erc20Abi, isAddress, parseUnits } from "viem";
import toast from "react-hot-toast";

import { useIsSafeOwner } from "@/hooks/useIsSafeOwner";
import { useSafeProposal } from "@/hooks/useSafeProposal";
import { useSafe } from "@/providers/SafeProvider";               // ✅ get Safe address here
import { pREWAAddresses, pREWAAbis } from "@/constants";

const inSafeApp = () =>
  typeof window !== "undefined" && window.parent !== window;

// yyyy-mm-dd -> unix seconds at 00:00 local
function dateInputToUnix(d: string): number {
  if (!d) return 0;
  const t = new Date(`${d}T00:00:00`);
  if (Number.isNaN(t.getTime())) return 0;
  return Math.floor(t.getTime() / 1000);
}

export default function CreateVestingSchedule() {
  const { chainId } = useAccount();
  const publicClient = usePublicClient();
  const safeMode = inSafeApp();

  const { isOwner, isLoading: isOwnerLoading } = useIsSafeOwner();
  const { proposeTransaction, isProposing } = useSafeProposal();
  const { safe, isSafe } = useSafe();                           // ✅ use SafeProvider
  const safeAddress = safe?.safeAddress as Address | undefined; // ✅ Safe address (if in Safe)

  // Form state
  const [beneficiary, setBeneficiary] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("");     // yyyy-mm-dd (native date picker)
  const [durationDays, setDurationDays] = useState("");
  const [cliffDays, setCliffDays] = useState("");
  const [revocable, setRevocable] = useState(true);

  // Contracts for current chain
  const addrs = useMemo(() => {
    if (!chainId) return undefined;
    return pREWAAddresses[chainId as keyof typeof pREWAAddresses];
  }, [chainId]);

  const vestingFactory = addrs?.VestingFactory as Address | undefined;
  const pREWA = addrs?.pREWAToken as Address | undefined;

  const disabled =
    isProposing ||
    isOwnerLoading ||
    !vestingFactory ||
    !beneficiary ||
    !amount ||
    !durationDays ||
    !cliffDays;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!vestingFactory || !pREWA) {
        toast.error("Unsupported network (pREWA / VestingFactory not configured).");
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

      // Read decimals and convert amount to wei
      const decimals = await publicClient.readContract({
        address: pREWA,
        abi: erc20Abi,
        functionName: "decimals",
      });
      const amountWei = parseUnits(amount, Number(decimals));

      // Convert inputs to seconds
      const startUnix = startDate ? dateInputToUnix(startDate) : 0;
      const duration = parseInt(durationDays || "0", 10);
      const cliff = parseInt(cliffDays || "0", 10);
      if (!Number.isFinite(duration) || duration <= 0) {
        toast.error("Duration must be a positive number of days.");
        return;
      }
      if (!Number.isFinite(cliff) || cliff < 0) {
        toast.error("Cliff must be a non-negative number of days.");
        return;
      }

      // We only support proposing from inside a Safe here (so allowance owner is the Safe)
      if (!isSafe || !safeAddress) {
        toast.error("Open this page inside your Safe to propose the transaction.");
        return;
      }

      // Check allowance: allowance(SAFE, factory)
      const allowance = (await publicClient.readContract({
        address: pREWA,
        abi: erc20Abi,
        functionName: "allowance",
        args: [safeAddress, vestingFactory],
      })) as bigint;

      if (allowance < amountWei) {
        // 1) Propose approval first
        const approveData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [vestingFactory, amountWei],
        }) as Hex;

        await proposeTransaction({
          to: pREWA,
          data: approveData,
          value: "0",
        });

        toast.success(
          "Approval proposed to Safe. Execute/confirm it, then come back to propose the vesting creation."
        );
        return;
      }

      // 2) Propose createVesting
      // createVesting(address beneficiary, uint256 startTime, uint256 cliffDuration, uint256 duration, bool revocable, uint256 amount)
      const data = encodeFunctionData({
        abi: pREWAAbis.VestingFactory as any,
        functionName: "createVesting",
        args: [
          beneficiary as Address,
          BigInt(startUnix),
          BigInt(cliff * 86400),
          BigInt(duration * 86400),
          revocable,
          amountWei,
        ],
      }) as Hex;

      await proposeTransaction({
        to: vestingFactory,
        data,
        value: "0",
      });

      toast.success("Vesting creation proposed to Safe.");
      // Optionally reset the form here
    } catch (err: any) {
      console.error(err);
      toast.error(err?.shortMessage ?? err?.message ?? "Failed to propose");
    }
  };

  // Outside Safe, only owners can see the form — same gating as before
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
          type="date"                                   // ✅ native date picker back
          className="w-full rounded-md border px-3 py-2"
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
