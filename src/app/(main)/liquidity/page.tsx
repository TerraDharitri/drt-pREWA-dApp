// src/app/(main)/liquidity/page.tsx
"use client";

import { LiquidityManagerDashboard } from "@/components/web3/liquidity/LiquidityManagerDashboard";
import { SectionHeader } from "@/components/layout/SectionHeader";

export default function LiquidityPage() {
  return (
    <div className="space-y-8 mt-4 md:mt-8">
      <SectionHeader
        title="Provide Liquidity"
        subtitle="Earn trading fees and amplify liquidity for a mission-driven token."
      />
      
      <p className="text-sm text-center text-muted-foreground -mt-6">
        When you provide liquidity, you receive LP tokens representing your share in the pool. You’ll earn a portion of the fees from every swap.
      </p>

      {/* FIX: Render the dashboard component that contains the tabs */}
      <LiquidityManagerDashboard />
    </div>
  );
}