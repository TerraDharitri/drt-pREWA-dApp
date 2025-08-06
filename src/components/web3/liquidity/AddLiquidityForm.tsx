"use client";
import React, { useState } from "react";
import { useAccount } from "wagmi";
import { pREWAAddresses } from "@/constants";
import { useTokenApproval } from "@/hooks/useTokenApproval";
import { useLiquidity } from "@/hooks/useLiquidity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { parseUnits } from "viem";

// For this example, we'll hardcode a pREWA-USDT pair.
// A real dApp would have a token selector.
const USDT_TESTNET_ADDRESS = "0x..."; // Replace with a real USDT or stablecoin address on BSC Testnet

export function AddLiquidityForm() {
  const { chainId } = useAccount();
  const liquidityManagerAddress = chainId
    ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LiquidityManager
    : undefined;
  const pREWAAddress = chainId
    ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.pREWAToken
    : undefined;

  const [pREWAAmount, setPREWAAmount] = useState("");
  const [otherTokenAmount, setOtherTokenAmount] = useState("");
  const [pairType, setPairType] = useState<"TOKEN" | "BNB">("TOKEN");

  const otherTokenForApproval =
    pairType === "TOKEN" ? USDT_TESTNET_ADDRESS : undefined;

  const {
    allowance: pREWAAllowance,
    approve: approvePREWA,
    isLoading: isPREWAApproving,
  } = useTokenApproval(pREWAAddress, liquidityManagerAddress);
  const {
    allowance: otherTokenAllowance,
    approve: approveOther,
    isLoading: isOtherApproving,
  } = useTokenApproval(otherTokenForApproval, liquidityManagerAddress);
  const {
    addLiquidity,
    addLiquidityBNB,
    isLoading: isLiquidityLoading,
  } = useLiquidity();

  const needsPREWAApproval =
    !pREWAAllowance || pREWAAllowance < parseUnits(pREWAAmount || "0", 18);
  const needsOtherApproval =
    pairType === "TOKEN" &&
    (!otherTokenAllowance ||
      otherTokenAllowance < parseUnits(otherTokenAmount || "0", 18));

  const handleSubmit = () => {
    if (pairType === "TOKEN") {
      if (needsPREWAApproval) approvePREWA();
      else if (needsOtherApproval) approveOther();
      else addLiquidity(USDT_TESTNET_ADDRESS, pREWAAmount, otherTokenAmount);
    } else {
      // BNB Pair
      if (needsPREWAApproval) approvePREWA();
      else addLiquidityBNB(pREWAAmount, otherTokenAmount);
    }
  };

  const getButtonText = () => {
    const isLoading =
      isPREWAApproving || isOtherApproving || isLiquidityLoading;
    if (isLoading) return <Spinner className="h-4 w-4" />;

    if (pairType === "TOKEN") {
      if (needsPREWAApproval) return "Approve pREWA";
      if (needsOtherApproval) return "Approve USDT";
      return "Add Liquidity";
    } else {
      // BNB
      if (needsPREWAApproval) return "Approve pREWA";
      return "Add Liquidity";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={() => setPairType("TOKEN")}
          variant={pairType === "TOKEN" ? "primary" : "secondary"}
        >
          Token Pair
        </Button>
        <Button
          onClick={() => setPairType("BNB")}
          variant={pairType === "BNB" ? "primary" : "secondary"}
        >
          BNB Pair
        </Button>
      </div>
      <div>
        <label>pREWA Amount</label>
        <Input
          type="text"
          value={pREWAAmount}
          onChange={(e) => setPREWAAmount(e.target.value)}
          placeholder="0.0"
        />
      </div>
      <div>
        <label>{pairType === "TOKEN" ? "USDT Amount" : "BNB Amount"}</label>
        <Input
          type="text"
          value={otherTokenAmount}
          onChange={(e) => setOtherTokenAmount(e.target.value)}
          placeholder="0.0"
        />
      </div>
      <Button
        onClick={handleSubmit}
        className="w-full"
        disabled={isPREWAApproving || isOtherApproving || isLiquidityLoading}
      >
        {getButtonText()}
      </Button>
    </div>
  );
}
