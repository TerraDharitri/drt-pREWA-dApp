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
      addTx: (t: TxRecord) => set((s) => ({ 
        txs: [t, ...s.txs.filter((x: TxRecord) => x.hash !== t.hash)] 
      })),
      updateTx: (hash: `0x${string}`, patch: Partial<TxRecord>) =>
        set((s) => ({
          txs: s.txs.map((x: TxRecord) =>
            x.hash === hash ? { ...x, ...patch, updatedAt: Date.now() } : x
          ),
        })),
      markRead: (hash: `0x${string}`) =>
        set((s) => ({ 
          txs: s.txs.map((x: TxRecord) => 
            x.hash === hash ? { ...x, read: true } : x
          ) 
        })),
      markAllRead: () => set((s) => ({ 
        txs: s.txs.map((x: TxRecord) => ({ ...x, read: true })) 
      })),
      clear: () => set({ txs: [] }),
    }),
    { 
      name: "drt:txlog", 
      storage: createJSONStorage(() => localStorage) 
    }
  )
);