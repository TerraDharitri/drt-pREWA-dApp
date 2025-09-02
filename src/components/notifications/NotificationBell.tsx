// src/components/notifications/NotificationBell.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useTxStore, selectAll } from "@/lib/txStore";
import { useShallow } from "zustand/react/shallow";

const shorten = (v: string) =>
  v && v.length > 10 ? `${v.slice(0, 6)}…${v.slice(-4)}` : v;

export default function NotificationBell() {
  const txs = useTxStore(useShallow(selectAll));
  const clear = useTxStore((s) => s.clear);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const pending = txs.filter((t) => t.status === "pending").length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center justify-center rounded-md p-2 hover:bg-greyscale-900"
      >
        <Bell className="w-5 h-5" />
        {pending > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] leading-none text-white">
            {pending}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-greyscale-800 bg-greyscale-950 shadow-lg">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-semibold">Recent transactions</span>
            <button
              className="text-xs text-greyscale-400 hover:text-greyscale-200"
              onClick={() => clear()}
            >
              Clear
            </button>
          </div>

          {txs.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-greyscale-400">
              No transactions yet.
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {txs.map((t) => {
                const title = t.title ?? t.label ?? t.kind.toUpperCase(); // ✅ safe fallback
                return (
                  <li key={t.id} className="px-3 py-2 hover:bg-greyscale-900">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{title}</span>
                      <span
                        className={
                          t.status === "pending"
                            ? "text-xs text-yellow-400"
                            : t.status === "success"
                            ? "text-xs text-green-400"
                            : "text-xs text-red-400"
                        }
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {t.hash ? shorten(t.hash) : "—"} · chain {t.chainId ?? "—"}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
