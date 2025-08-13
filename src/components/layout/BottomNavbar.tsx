// src/components/layout/BottomNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Repeat, Droplets, Gem, Layers, Gift, PieChart } from "lucide-react";

// Add icons to your navigation items
const navigationItems = [
  { title: "Swap", url: "/swap", icon: Repeat },
  { title: "Pools", url: "/liquidity", icon: Droplets },
  { title: "Stake", url: "/stake", icon: Gem },
  { title: "LP Stake", url: "/lp-staking", icon: Layers },
  { title: "Vesting", url: "/vesting", icon: PieChart },
  { title: "Donate", url: "/donate", icon: Gift },
];

export function BottomNavbar() {
  const pathname = usePathname();

  return (
    // FIX: Changed from lg:hidden to xl:hidden to match the new breakpoint logic
    <div className="lg:hidden fixed bottom-0 left-0 z-20 w-full h-20 bg-white border-t border-greyscale-200/60 dark:bg-dark-surface dark:border-dark-border">
      <nav className="grid h-full grid-cols-6">
        {navigationItems.map((item) => {
          const isActive = pathname.startsWith(item.url);
          return (
            <Link
              href={item.url}
              key={item.title}
              className={`flex flex-col items-center justify-center text-xs transition-colors ${
                isActive
                  ? "text-primary-100 dark:text-primary-300"
                  : "text-greyscale-400 dark:text-dark-text-secondary hover:text-primary-100 dark:hover:text-primary-300"
              }`}
            >
              <item.icon className="h-6 w-6 mb-1" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}