"use client";
import React, { useState, useMemo } from "react";
import { useReadContract, useAccount, useBalance } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { useDonate } from "@/hooks/useDonate";
import { formatAddress } from "@/lib/web3-utils";
import { isValidNumberInput } from "@/lib/utils";
import { Address, formatUnits, isAddress, parseUnits } from "viem";
import toast from "react-hot-toast";

export function DonateCard() {
  const { chainId, address } = useAccount();
  const [amount, setAmount] = useState("");
  const { donate, isLoading } = useDonate();

  const isAmountValid = useMemo(() => isValidNumberInput(amount), [amount]);

  const emergencyControllerAddress = chainId
    ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]
        ?.EmergencyController
    : undefined;

  const { data: donationAddressResult } = useReadContract({
    address: emergencyControllerAddress,
    abi: pREWAAbis.EmergencyController,
    functionName: "recoveryAdminAddress",
    query: { enabled: !!emergencyControllerAddress },
  });

  const donationAddress = donationAddressResult as Address | undefined;

  // ✅ Narrow chainId to the union wagmi expects (56 | 97 | undefined)
  const typedChainId = chainId === 56 ? 56 : chainId === 97 ? 97 : undefined;

  const { data: balance } = useBalance({
    address,
    chainId: typedChainId,
  });

  const handleDonate = () => {
    if (donationAddress && isAddress(donationAddress) && isAmountValid) {
      const amountInWei = parseUnits(amount, 18); // BNB has 18 decimals
      donate(donationAddress, amountInWei);
    } else {
      toast.error("Donation address is not configured or available.");
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Support the Protocol</CardTitle>
        <CardDescription>
          Your donations help fund development and secure the future of the
          Dharitri Protocol. All donations are sent in the native network
          currency (BNB).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <label className="text-sm font-medium">Donation Amount (BNB)</label>
            {balance && (
              <span className="text-xs text-gray-500">
                Balance: {formatUnits(balance.value, balance.decimals)}
              </span>
            )}
          </div>
          <Input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="mt-1"
          />
        </div>

        <div className="text-xs text-center text-gray-500">
          {donationAddress ? (
            <span>
              Donations will be sent to: {formatAddress(donationAddress)}
            </span>
          ) : (
            <Spinner />
          )}
        </div>

        <Button
          onClick={handleDonate}
          disabled={isLoading || !isAmountValid || !donationAddress}
          className="w-full"
        >
          {isLoading && <Spinner className="mr-2" />}
          Donate
        </Button>
      </CardContent>
    </Card>
  );
}
