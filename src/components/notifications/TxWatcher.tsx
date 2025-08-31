// src/components/notifications/TxWatcher.tsx
"use client";

import { useEffect } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import { useTxStore, selectPending } from "@/lib/txStore";
import { useShallow } from "zustand/react/shallow";

function ReceiptProbe({
  id,
  hash,
  chainId,
}: {
  id: string;
  hash: `0x${string}`;
  chainId?: number;
}) {
  const setStatus = useTxStore((s) => s.setStatus);

  const { isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
    chainId: chainId as any,
    confirmations: 1,
    query: { enabled: true, refetchInterval: 1500 },
  });

  useEffect(() => {
    if (isSuccess) setStatus(id, "success");
    if (isError) setStatus(id, "error");
  }, [id, isSuccess, isError, setStatus]);

  return null;
}

export default function TxWatcher() {
  const pending = useTxStore(useShallow(selectPending));
  if (pending.length === 0) return null;

  return (
    <>
      {pending.map((t) => (
        <ReceiptProbe key={t.id} id={t.id} hash={t.hash} chainId={t.chainId} />
      ))}
    </>
  );
}