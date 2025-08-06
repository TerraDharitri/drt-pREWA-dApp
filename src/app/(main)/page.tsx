// src/app/(main)/page.tsx

"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h1 className="text-greyscale-900 dark:text-dark-text-primary mb-4 text-4xl font-extrabold md:text-5xl">
        Welcome to the Dharitri Protocol
      </h1>
      <p className="text-greyscale-400 dark:text-dark-text-secondary mx-auto mb-8 max-w-2xl text-lg">
        Your gateway to staking, swapping, and managing your pREWA
        assets securely on the BNB Smart Chain.
      </p>
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link href="/stake">
          <Button variant="default" size="lg">
            Stake pREWA
          </Button>
        </Link>
        <Link href="/liquidity">
          <Button variant="secondary" size="lg">
            Provide Liquidity
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" size="lg">
            View Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}