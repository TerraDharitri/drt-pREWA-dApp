"use client";

import Link from "next/link";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white shadow-sm">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2">
          {/* You can replace this with an SVG logo */}
          <span className="text-2xl font-bold text-gray-900">
            drt-pREWA
          </span>
        </Link>
        
        <div className="hidden items-center space-x-6 md:flex">
          <Link href="/stake" className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600">
            Stake
          </Link>
          <Link href="/liquidity" className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600">
            Liquidity
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600">
            Dashboard
          </Link>
        </div>
        
        <div className="flex items-center">
          <ConnectWalletButton />
        </div>
      </nav>
    </header>
  );
}