// src/components/layout/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { usePathname } from "next/navigation";
import { NetworkSwitcher } from "../web3/NetworkSwitcher";
import { ProtocolStats } from "../web3/ProtocolStats";
import { useAccount } from "wagmi";
import NotificationBell from "@/components/notifications/NotificationBell";

type NavbarProps = {
  className?: string;
};

const navigationItems = [
  { id: 1, title: "Swap", url: "/swap" },
  { id: 2, title: "Pools", url: "/liquidity" },
  { id: 3, title: "Stake", url: "/stake" },
  { id: 7, title: "LP Staking", url: "/lp-staking" },
  { id: 4, title: "Vesting", url: "/vesting" },
  { id: 5, title: "Dashboard", url: "/dashboard" },
  { id: 6, title: "Donate", url: "/donate" }, // enable once donation contracts deployed
];

function useIsSafeIframe() {
  const [isSafe, setIsSafe] = useState(false);
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.parent !== window) {
        setIsSafe(true);
      }
    } catch {
      // Cross-origin errors are expected, treat as not in Safe
    }
  }, []);
  return isSafe;
}

const Navbar = ({ className }: NavbarProps) => {
  const pathname = usePathname();
  const { address } = useAccount();
  const isSafe = useIsSafeIframe();

  const isActive = (path: string) => pathname === path;

  // This navbar is now simplified and doesn't need its own open/close state.
  
  return (
    <header
      className={`fixed w-full top-0 z-30 border-b transition-colors ${
        className || ""
      } border-greyscale-200/60 bg-white dark:border-dark-border dark:bg-dark-surface`}
    >
      <div className="w-full px-4 flex h-22 items-center justify-between md:h-18">
        {/* Logo and Brand */}
        {/* FIX: Removed responsive classes from the Link to ensure it's always flexible */}
        <Link className="flex shrink-0 items-center" href="/">
          <Image
            className="w-7 opacity-100"
            src="/images/graphics/logo/Dharitri Logo dark.svg"
            width={38}
            height={38}
            alt="Dharitri"
            priority
          />
          {/* FIX: Removed the `hidden` class so "Dharitri" is visible on mobile */}
          <span
            className={`ml-2 text-2xl font-bold transition-colors text-greyscale-900 dark:text-dark-text-primary`}
          >
            Dharitri
          </span>
        </Link>

        {/* Desktop Navigation (Hidden on screens smaller than lg) */}
        <nav className="hidden lg:flex flex-1 items-center space-x-1 ml-4">
          {navigationItems.map((link) => (
            <Link
              className={`whitespace-nowrap px-4 py-3 text-lg font-medium transition-colors ${
                isActive(link.url)
                  ? "text-primary-100 dark:text-primary-300"
                  : "text-greyscale-900 dark:text-dark-text-primary hover:text-primary-100 dark:hover:text-primary-300"
              }`}
              href={link.url}
              key={link.id}
            >
              {link.title}
            </Link>
          ))}
        </nav>

        {/* Right-side items */}
        <div className="flex items-center space-x-2 sm:space-x-4">
            
            <div className="hidden md:flex">
                <ProtocolStats />
            </div>
             <div className="hidden sm:flex">
                <NetworkSwitcher />
            </div>
          {!isSafe ? (
            <ConnectWalletButton />
          ) : (
            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-800 dark:bg-neutral-800 dark:text-gray-100">
              {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Safe App"}
            </span>
          )}
           {/* NEW: the bell */}
          <div className="hidden sm:flex">
            <NotificationBell />
          </div>
          <div className="hidden sm:flex">
             <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;