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
  { id: 6, title: "Donate", url: "/donate" },
];

// Local, robust Safe-iframe detection (no dependency on a separate hook)
function useIsSafeIframe() {
  const [isSafe, setIsSafe] = useState(false);

  useEffect(() => {
    try {
      const ref = typeof document !== "undefined" ? document.referrer || "" : "";
      if (/\.safe\.global/i.test(ref)) {
        setIsSafe(true);
        return;
      }
      // Some browsers provide document.ancestorOrigins as a DOMStringList
      const ao = (typeof document !== "undefined"
        ? ((document as any).ancestorOrigins as unknown)
        : undefined) as { length: number; item: (i: number) => string } | string[] | undefined;

      if (ao) {
        // Avoid Array.from on unknown types; iterate defensively
        const len = (ao as any).length ?? 0;
        for (let i = 0; i < len; i++) {
          const origin = typeof (ao as any).item === "function" ? (ao as any).item(i) : (ao as any)[i];
          if (typeof origin === "string" && /\.safe\.global/i.test(origin)) {
            setIsSafe(true);
            return;
          }
        }
      }
    } catch {
      // swallow
    }
  }, []);

  return isSafe;
}

const Navbar = ({ className }: NavbarProps) => {
  const [visible, setVisible] = useState<boolean>(false);
  const pathname = usePathname();
  const { address } = useAccount();
  const isSafe = useIsSafeIframe();

  const toggleMenu = () => setVisible((v) => !v);
  const closeMenu = () => setVisible(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = visible ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [visible]);

  const isActive = (path: string) => pathname === path;

  return (
    <header
      className={`fixed left-30 right-30 top-0 z-30 border-b transition-colors duration-1200 ${
        className || ""
      } border-greyscale-200/60 bg-white dark:border-dark-border dark:bg-dark-surface`}
    >
      <div className="w-full px-4 flex h-22 items-center md:h-18">
        {/* Logo + Brand */}
        <Link className="mr-6 flex shrink-0 items-center lg:mr-auto" href="/">
          <Image
            className="w-7 opacity-100"
            src="/images/graphics/logo/Dharitri Logo dark.svg"
            width={38}
            height={38}
            alt="Dharitri"
            priority
          />
          <span
            className={`ml-2 text-2xl font-bold transition-colors text-greyscale-900 dark:text-dark-text-primary`}
          >
            Dharitri
          </span>
        </Link>

        {/* Main navigation */}
        <div
          className={`flex flex-1 items-center lg:fixed lg:bottom-0 lg:right-0 lg:top-0 lg:z-10 lg:w-80 lg:translate-x-full lg:flex-col lg:items-stretch lg:bg-white lg:p-8 lg:pt-20 lg:transition-transform dark:lg:bg-dark-surface ${
            visible ? "!translate-x-0" : ""
          }`}
        >
          <nav className="flex flex-nowrap items-center space-x-1 overflow-x-auto lg:flex-col lg:items-stretch lg:space-x-0 lg:space-y-8">
            {navigationItems.map((link) => (
              <Link
                className={`whitespace-nowrap px-4 py-3 text-lg font-medium transition-colors lg:text-6x ${
                  isActive(link.url)
                    ? "text-primary-100 dark:text-primary-300"
                    : "text-greyscale-900 dark:text-dark-text-primary hover:text-primary-100 dark:hover:text-primary-300"
                }`}
                href={link.url}
                key={link.id}
                onClick={closeMenu}
              >
                {link.title}
              </Link>
            ))}
          </nav>

          {/* Right-side widgets */}
          <div className="ml-auto flex items-center space-x-4 lg:ml-0 lg:mt-auto lg:flex-col lg:items-stretch lg:space-y-4">
            <div className="lg:order-1">
              <ProtocolStats />
            </div>
            <div className="lg:order-2">
              <NetworkSwitcher />
            </div>

            {/* In Safe: hide Connect button and show a small address chip instead */}
            <div className="lg:order-3">
              {!isSafe ? (
                <ConnectWalletButton />
              ) : (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800 dark:bg-neutral-800 dark:text-gray-100">
                  {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Safe Connected"}
                </span>
              )}
            </div>

            <div className="lg:order-last">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Hamburger */}
        <button
          className={`relative z-20 hidden h-6 w-6 flex-col items-start justify-center tap-highlight-color before:h-0.5 before:w-5 before:rounded-full before:transition-all after:h-0.5 after:w-5 after:rounded-full after:transition-all lg:flex ${
            visible
              ? "before:translate-y-[0.37rem] before:rotate-45 after:-translate-y-[0.37rem] after:-rotate-45"
              : ""
          } before:bg-greyscale-900 after:bg-greyscale-900 dark:before:bg-greyscale-0 dark:after:bg-greyscale-0`}
          onClick={toggleMenu}
          aria-label="Toggle navigation"
        >
          <span
            className={`my-1 h-0.5 w-5 rounded-full transition-all ${
              visible ? "w-0 opacity-0" : ""
            } bg-greyscale-900 dark:bg-greyscale-0`}
          />
        </button>
      </div>

      {/* Overlay for mobile menu */}
      <div
        className={`fixed inset-0 z-5 hidden bg-greyscale-900/90 transition-opacity lg:block ${
          visible ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={closeMenu}
      />
    </header>
  );
};

export default Navbar;
