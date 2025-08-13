// src/app/(main)/liquidity/page.tsx
"use client";

import { LiquidityManagerDashboard } from "@/components/web3/liquidity/LiquidityManagerDashboard";
import { Info } from 'lucide-react';

export default function LiquidityPage() {
  return (
    <div className="space-y-8 mt-4 md:mt-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Provide Liquidity</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mt-2">
          Earn trading fees and amplify liquidity for a mission-driven token.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          When you provide liquidity, you receive LP tokens representing your share in the pool. You’ll earn a portion of the fees from every swap.
        </p>
      </div>
      <LiquidityManagerDashboard />
    </div>
  );
}