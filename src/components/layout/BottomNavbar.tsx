// src/components/layout/BottomNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Repeat, Droplets, Gem, Layers, PieChart, LayoutDashboard, Gift } from "lucide-react";

const navigationItems = [
  { title: "Swap", url: "/swap", icon: Repeat },
  { title: "Pools", url: "/liquidity", icon: Droplets },
  { title: "Stake", url: "/stake", icon: Gem },
  { title: "LP Stake", url: "/lp-staking", icon: Layers },
  { title: "Vesting", url: "/vesting", icon: PieChart },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Donate", url: "/donate", icon: Gift },
];

export function BottomNavbar() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 z-20 w-full h-20 bg-white border-t border-greyscale-200/60 dark:bg-dark-surface dark:border-dark-border">
      {/* FIX: Use a specific grid column class to ensure horizontal layout */}
      <nav className="grid h-full grid-cols-7">
        {navigationItems.map((item) => {
          const isActive = pathname.startsWith(item.url);
          return (
            <Link
              href={item.url}
              key={item.title}
              // FIX: Reduced text and icon sizes for better fit
              className={`flex flex-col items-center justify-center text-[10px] transition-colors ${
                isActive
                  ? "text-primary-100 dark:text-primary-300"
                  : "text-greyscale-400 dark:text-dark-text-secondary hover:text-primary-100 dark:hover:text-primary-300"
              }`}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}