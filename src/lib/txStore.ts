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

export interface TxItem {
  id: string; // `${chainId}:${hash}`
  hash: `0x${string}`;
  chainId: number;
  address?: `0x${string}`;
  title: string;
  kind: TxKind;
  ts: number;
  status: TxStatus;
  meta?: Record<string, any>;
  error?: string;
}

type Store = {
  txs: TxItem[];
  add: (tx: TxItem) => void;
  setStatus: (id: string, status: TxStatus, error?: string) => void;
  clear: () => void;
};

export const useTxStore = create<Store>()(
  persist(
    (set) => ({
      txs: [],
      add: (tx) =>
        set((s) => {
          if (s.txs.some((t) => t.id === tx.id)) return s;
          return { txs: [tx, ...s.txs].slice(0, 100) };
        }),
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