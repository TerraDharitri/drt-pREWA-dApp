// src/components/ui/StakingTierCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StakingTier {
  id: number;
  duration: number;
  rewardMultiplier: number;
  earlyWithdrawalPenalty: number;
}

interface StakingTierCardProps {
  tier: StakingTier;
  baseApr?: number;
  isSelected: boolean;
  onClick: () => void;
}

export function StakingTierCard({ tier, baseApr, isSelected, onClick }: StakingTierCardProps) {
  // Calculate the resultant APR if the base APR is provided and greater than zero
  const resultantApr =
    baseApr && baseApr > 0
      ? (baseApr * tier.rewardMultiplier).toFixed(2)
      : null;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all border-2",
        isSelected
          ? "border-primary-100 dark:border-primary-300 ring-2 ring-primary-100/50 dark:ring-primary-300/50"
          : "border-border hover:border-primary-100/50 dark:hover:border-primary-300/50"
      )}
    >
      <CardContent className="p-1 text-center">
        <div className="text-lg font-bold">{tier.duration} Days</div>
        {/* FIX: Display Resultant APR instead of Multiplier */}
        <div className="text-sm text-primary-100 dark:text-primary-300 font-medium">
          {resultantApr ? `${resultantApr}% APR` : `${tier.rewardMultiplier}x Rewards`}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {tier.earlyWithdrawalPenalty}% Early Exit Penalty
        </div>
      </CardContent>
    </Card>
  );
}