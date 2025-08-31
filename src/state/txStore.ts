"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type TxKind =
  | "swap"
  | "liquidity"
  | "lp-stake"
  | "stake"
  | "unstake"
  | "claim"
  | "vesting"
  | "approve"
  | "donate"
  | "transfer";

export type TxStatus = "pending" | "success" | "error";

export type TxRecord = {
  hash: `0x${string}`;
  chainId: number;
  kind: TxKind;
  title?: string;
  address?: `0x${string}`;
  status: TxStatus;
  createdAt: number;
  updatedAt: number;
  read?: boolean;
  meta?: Record<string, any>;
};

type TxStore = {
  txs: TxRecord[];
  addTx: (t: TxRecord) => void;
  updateTx: (hash: `0x${string}`, patch: Partial<TxRecord>) => void;
  markRead: (hash: `0x${string}`) => void;
  markAllRead: () => void;
  clear: () => void;
};

export const useTxStore = create<TxStore>()(
  persist(
    (set, get) => ({
      txs: [],
      addTx: (t) => set((s) => ({ txs: [t, ...s.txs.filter((x) => x.hash !== t.hash)] })),
      updateTx: (hash, patch) =>
        set((s) => ({
          txs: s.txs.map((x) =>
            x.hash === hash ? { ...x, ...patch, updatedAt: Date.now() } : x
          ),
        })),
      markRead: (hash) =>
        set((s) => ({ txs: s.txs.map((x) => (x.hash === hash ? { ...x, read: true } : x)) })),
      markAllRead: () => set((s) => ({ txs: s.txs.map((x) => ({ ...x, read: true })) })),
      clear: () => set({ txs: [] }),
    }),
    { name: "drt:txlog", storage: createJSONStorage(() => localStorage) }
  )
);
