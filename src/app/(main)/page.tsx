// src/app/(main)/page.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/layout/SectionHeader";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 md:py-24">
       <SectionHeader 
          title="Finance for a Greener Future."
          subtitle="Stake, swap, and manage pREWA — every action supports farmers with digital IDs, knowledge access, and rewards for sustainable practices."
       />
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/stake">Start Earning</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/liquidity">Fund a Green Pool</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/dashboard">Track Your Impact</Link>
        </Button>
      </div>
    </div>
  );
}