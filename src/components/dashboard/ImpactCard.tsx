// src/components/dashboard/ImpactCard.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Sprout, TreePine, Leaf } from "lucide-react";
import Link from "next/link";

export type ImpactMetrics = {
  hectaresUnderRegen?: string;
  farmersWithIDs?: string;
  projectedCO2e?: string;
  methodologyHref?: string;
};

export function ImpactCard({
  metrics = {
    hectaresUnderRegen: "1,500+",
    farmersWithIDs: "250+",
    projectedCO2e: "~7,500 tCO₂e",
    methodologyHref: "https://www.dharitri.org/",
  },
}: {
  metrics?: ImpactMetrics;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Protocol Impact (Pilot)</CardTitle>
        <CardDescription>
          Early estimates while field integrations are rolling out.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <ImpactStat
            icon={TreePine}
            label="Hectares under Regenerative Practice"
            value={metrics.hectaresUnderRegen}
          />
          <ImpactStat
            icon={Sprout}
            label="Farmers Onboarded with Digital IDs"
            value={metrics.farmersWithIDs}
          />
          <ImpactStat
            icon={Leaf}
            label="Projected Annual Carbon Sequestration"
            value={metrics.projectedCO2e}
          />
        </div>
        {metrics.methodologyHref && (
          <div className="pt-4 text-sm">
            <Link
              href={metrics.methodologyHref}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:no-underline"
            >
              Learn more about our methodology
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ImpactStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
      </div>
      <div className="mt-2 text-lg font-semibold">{value ?? "—"}</div>
    </div>
  );
}