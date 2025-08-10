"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import { ConnectKitButton } from "connectkit";
import { isInSafeApp } from "@/lib/safe";

export function Header() {
  const [safeMode, setSafeMode] = React.useState(false);
  React.useEffect(() => setSafeMode(isInSafeApp()), []);

  return (
    <header className="w-full border-b bg-white/80 backdrop-blur dark:bg-black/40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          {/* If you keep your logo at public/logo.svg this will render it.
              Change /logo.svg to whatever you actually have. */}
          <Image
            src="/logo.svg"
            alt="Dharitri"
            width={28}
            height={28}
            className="shrink-0"
            onError={(e) => {
              // fallback: hide broken image (text label remains)
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="text-lg font-semibold">Dharitri</span>
        </Link>

        {/* Primary nav */}
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/swap" className="hover:opacity-80">Swap</Link>
          <Link href="/liquidity" className="hover:opacity-80">Pools</Link>
          <Link href="/stake" className="hover:opacity-80">Stake</Link>
          <Link href="/lp-staking" className="hover:opacity-80">LP Staking</Link>
          <Link href="/vesting" className="hover:opacity-80">Vesting</Link>
          <Link href="/dashboard" className="hover:opacity-80">Dashboard</Link>
          <Link href="/donate" className="hover:opacity-80">Donate</Link>
        </nav>

        {/* Right side: connect (hidden in Safe) */}
        <div className="flex items-center gap-3">
          {safeMode ? (
            <span className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
              Safe mode
            </span>
          ) : (
            <ConnectKitButton />
          )}
        </div>
      </div>
    </header>
  );
}
