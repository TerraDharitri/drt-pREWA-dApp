// src/lib/logTx.ts
"use client";

import { useTxStore } from "./txStore";
import type { TxKind } from "./txStore";

export type LogInput = {
  hash: `0x${string}`;
  chainId: number;
  title: string;
  kind: TxKind;
  /** accepted but not stored unless TxRow defines it */
  address?: `0x${string}`;
  meta?: Record<string, any>;
};

export function logTx(input: LogInput) {
  const id = `${input.chainId}:${input.hash}`;

  useTxStore.getState().push({
    id,
    hash: input.hash,
    chainId: input.chainId,
    title: input.title,
    kind: input.kind,
    status: "pending",         
    timestamp: Date.now(),
  });
}
