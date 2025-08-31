// src/components/notifications/NotificationBell.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useTxStore, selectAll } from "@/lib/txStore";
import { useShallow } from "zustand/react/shallow";

const shorten = (v: string) =>
  v.length > 10 ? `${v.slice(0, 6)}…${v.slice(-4)}` : v;

export default function NotificationBell() {
  const txs = useTxStore(useShallow(selectAll));
  const clear = useTxStore((s) => s.clear);
  const [open, setOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const hasPending = txs.some((t) => t.status === "pending");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={bellRef}>
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
      >
        <Bell className="h-5 w-5" />
        {hasPending && (
          <span className="absolute right-1 top-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-md border bg-white p-3 text-sm shadow-lg dark:border-dark-border dark:bg-dark-surface">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold">Activity</div>
            <button
              className="text-xs text-gray-500 hover:underline"
              onClick={() => clear()}
            >
              Clear All
            </button>
          </div>

          {txs.length === 0 ? (
            <div className="py-6 text-center text-gray-500">No activity yet.</div>
          ) : (
            <ul className="max-h-96 space-y-2 overflow-y-auto">
              {txs.map((t) => (
                <li
                  key={t.id}
                  className="rounded border p-2 dark:border-dark-border"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t.title}</span>
                    <span
                      className={
                        t.status === "pending"
                          ? "text-amber-600"
                          : t.status === "success"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {shorten(t.hash)} · chain {t.chainId}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}