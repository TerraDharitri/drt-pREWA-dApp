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

const Navbar = ({ className }: NavbarProps) => {
  const [visible, setVisible] = useState<boolean>(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setVisible(!visible);
  };

  const closeMenu = () => {
    setVisible(false);
  };
  
  useEffect(() => {
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
      {/* Changed container to full width */}
      <div className="w-full px-4 flex h-22 items-center md:h-18">
        {/* Reduced logo margin */}
        <Link className="mr-6 flex shrink-0 items-center lg:mr-auto" href="/">
          <Image
            className="w-7 opacity-100"
            src="/images/graphics/logo/Dharitri Logo dark.svg"
            width={38}
            height={38}
            alt="Dharitri"
          />
          <span
            className={`ml-2 text-2xl font-bold transition-colors ${"text-greyscale-900 dark:text-dark-text-primary"}`}
          >
            Dharitri
          </span>
        </Link>
        
        {/* Main navigation container - now full width */}
        <div
          className={`flex flex-1 items-center lg:fixed lg:bottom-0 lg:right-0 lg:top-0 lg:z-10 lg:w-80 lg:translate-x-full lg:flex-col lg:items-stretch lg:bg-white lg:p-8 lg:pt-20 lg:transition-transform dark:lg:bg-dark-surface ${
            visible ? "!translate-x-0" : ""
          }`}
        >
          {/* Navigation items - now with flex-nowrap and reduced spacing */}
          <nav className="flex flex-nowrap items-center space-x-1 overflow-x-auto lg:flex-col lg:items-stretch lg:space-x-0 lg:space-y-8">
            {navigationItems.map((link) => (
              <Link
                className={`whitespace-nowrap px-4 py-3 text-lg font-medium transition-colors lg:text-6x ${isActive(link.url) ? "text-primary-100 dark:text-primary-300" : "text-greyscale-900 dark:text-dark-text-primary hover:text-primary-100 dark:hover:text-primary-300"}`}
                href={link.url}
                key={link.id}
                onClick={closeMenu}
              >
                {link.title}
              </Link>
            ))}
          </nav>
          
          {/* Right-side elements */}
          <div className="ml-auto flex items-center space-x-4 lg:ml-0 lg:mt-auto lg:flex-col lg:items-stretch lg:space-y-4">
             <div className="lg:order-1"><ProtocolStats /></div>
             <div className="lg:order-2"><NetworkSwitcher /></div>
             <div className="lg:order-3"><ConnectWalletButton /></div>
             <div className="lg:order-last"><ThemeToggle /></div>
          </div>
        </div>
        <button
          className={`relative z-20 hidden h-6 w-6 flex-col items-start justify-center tap-highlight-color before:h-0.5 before:w-5 before:rounded-full before:transition-all after:h-0.5 after:w-5 after:rounded-full after:transition-all lg:flex ${
            visible
              ? "before:translate-y-[0.37rem] before:rotate-45 after:-translate-y-[0.37rem] after:-rotate-45"
              : ""
          } before:bg-greyscale-900 after:bg-greyscale-900 dark:before:bg-greyscale-0 dark:after:bg-greyscale-0`}
          onClick={toggleMenu}
        >
          <span
            className={`my-1 h-0.5 w-5 rounded-full transition-all ${
              visible ? "w-0 opacity-0" : ""
            } bg-greyscale-900 dark:bg-greyscale-0`}
          ></span>
        </button>
      </div>
      <div
        className={`fixed inset-0 z-5 hidden bg-greyscale-900/90 transition-opacity lg:block ${
          visible ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={closeMenu}
      ></div>
    </header>
  );
};

export default Navbar;