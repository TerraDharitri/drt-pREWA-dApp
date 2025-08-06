"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { useWatchAsset } from "@/hooks/useWatchAsset";
import { formatBigInt } from "@/lib/web3-utils";
import { Address } from "viem";
import Link from "next/link";

interface LiquiditySuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  lpAmount: bigint;
  lpTokenAddress: Address;
  lpTokenSymbol: string;
}

export function LiquiditySuccessModal({ isOpen, onClose, lpAmount, lpTokenAddress, lpTokenSymbol }: LiquiditySuccessModalProps) {
  const { addTokenToWallet } = useWatchAsset();

  const handleAddToWallet = () => {
    // LP tokens are standard ERC20s and almost always have 18 decimals.
    addTokenToWallet(lpTokenAddress, lpTokenSymbol, 18);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Liquidity Added Successfully!">
      <div className="space-y-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">You have received:</p>
        <div className="text-2xl font-bold text-primary-100 dark:text-primary-300">
          {formatBigInt(lpAmount, 18, 6)} {lpTokenSymbol}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This token represents your share in the liquidity pool.
        </p>
        <div className="flex flex-col gap-3 pt-2">
            <Button onClick={handleAddToWallet}>
                Add {lpTokenSymbol} to Wallet
            </Button>
            <Link href="/lp-staking" passHref>
                <Button variant="primary" className="w-full" onClick={onClose}>
                    Stake Your LP Tokens
                </Button>
            </Link>
        </div>
      </div>
    </Modal>
  );
}