// src/lib/txStore.ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TxStatus = "pending" | "success" | "error";
export type TxKind =
  | "swap"
  | "approve"
  | "stake"
  | "unstake"
  | "liquidity"
  | "vesting"
  | "donate"
  | "custom";

export type TxRow = {
  id: string;
  hash?: `0x${string}`;
  status: TxStatus;
  kind: TxKind;

  /** Optional text used by UIs (NotificationBell, toasts, etc.) */
  title?: string;        // ✅ added for NotificationBell
  label?: string;

  /** Optional chain id for links/UI */
  chainId?: number;

  error?: string;
  timestamp: number;
};

type Store = {
  txs: TxRow[];
  push: (tx: TxRow) => void;
  setStatus: (id: string, status: TxStatus, error?: string) => void;
  clear: () => void;
};

export const useTxStore = create<Store>()(
  persist(
    (set, get) => ({
      txs: [],
      push: (tx) =>
        set((s) => ({ txs: [tx, ...s.txs].slice(0, 100) })),
      setStatus: (id, status, error) =>
        set((s) => ({
          txs: s.txs.map((t) => (t.id === id ? { ...t, status, error } : t)),
        })),
      clear: () => set({ txs: [] }),
    }),
    { name: "tx-store-v1" }
  )
);

export const selectAll = (s: Store) => s.txs;
export const selectPending = (s: Store) =>
  s.txs.filter((t) => t.status === "pending");
