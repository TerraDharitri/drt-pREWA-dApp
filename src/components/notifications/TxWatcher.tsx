"use client";

import { useEffect } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import { useTxStore, selectPending } from "@/lib/txStore";
import { useShallow } from "zustand/react/shallow";
import type { Chain } from "wagmi/chains";


function ReceiptProbe(props: {
  id: string;
  /** Optional because TxRow.hash is optional; when absent we no-op */
  hash?: `0x${string}`;
  /** May be any number in store; we normalize to 56 | 97 for wagmi */
  chainId?: number;
}) {
  const { id, hash, chainId } = props;
  const setStatus = useTxStore((s) => s.setStatus);

  // normalize to wagmi’s literal type
  const cid = (chainId === 56 || chainId === 97 ? chainId : undefined) as
    | 56
    | 97
    | undefined;

  const wait = useWaitForTransactionReceipt({
    hash,                 // undefined disables the query below
    chainId: cid,
    query: { enabled: Boolean(hash) },
  });

  useEffect(() => {
    if (!hash) return;
    if (wait.isSuccess) setStatus(id, "success");
    else if (wait.isError) setStatus(id, "error", (wait.error as any)?.message);
  }, [id, hash, wait.isSuccess, wait.isError, wait.error, setStatus]);

  return null;
}

export default function TxWatcher() {
  const pending = useTxStore(useShallow(selectPending));
  if (pending.length === 0) return null;
  return (
    <>
      {pending.map((t) => (
        <ReceiptProbe
          key={t.id}
          id={t.id}
          hash={t.hash as `0x${string}` | undefined}
          chainId={t.chainId}
        />
      ))}
    </>
  );
}
