'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SafeAppsSDK, { BaseTransaction } from '@safe-global/safe-apps-sdk';

export type ProposeArgs = {
  to: `0x${string}`;
  data?: `0x${string}`;
  value?: string; // decimal string in wei, default "0"
};

export function useSafeProposal() {
  const [isSafe, setIsSafe] = useState(false);
  const [safeAddress, setSafeAddress] = useState<`0x${string}` | undefined>();
  const [chainId, setChainId] = useState<number | undefined>();
  const [isProposing, setIsProposing] = useState(false);

  const sdkRef = useRef<SafeAppsSDK | null>(null);
  if (!sdkRef.current) {
    try {
      sdkRef.current = new SafeAppsSDK();
    } catch {
      // outside Safe -> keep null
    }
  }

  useEffect(() => {
    const inIframe =
      typeof window !== 'undefined' &&
      window.parent &&
      window.parent !== window;

    setIsSafe(Boolean(inIframe));

    if (!inIframe || !sdkRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const safeInfo = await sdkRef.current!.safe.getInfo();
        if (cancelled) return;

        setSafeAddress(safeInfo.safeAddress as `0x${string}`);

        // Some SDK versions include chainId on the Safe info
        const cid =
          // number
          (safeInfo as any)?.chainId ??
          // sometimes string
          (typeof (safeInfo as any)?.chainId === 'string'
            ? Number((safeInfo as any).chainId)
            : undefined);

        if (typeof cid === 'number' && Number.isFinite(cid)) {
          setChainId(cid);
        } else {
          setChainId(undefined);
        }
      } catch {
        // leave undefined; UI guards on isSafe/safeAddress
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const proposeTransaction = useCallback(
    async ({ to, data, value = '0' }: ProposeArgs) => {
      if (!isSafe || !sdkRef.current) {
        throw new Error(
          'Open this page inside your Safe to propose the transaction.'
        );
      }

      setIsProposing(true);
      try {
        const tx: BaseTransaction = {
          to,
          value,
          data: (data ?? '0x') as string, // SDK expects plain string
        };

        // Returns { safeTxHash }
        return await sdkRef.current.txs.send({ txs: [tx] });
      } finally {
        setIsProposing(false);
      }
    },
    [isSafe]
  );

  return useMemo(
    () => ({
      isSafe,
      safeAddress,
      chainId,
      isProposing,
      proposeTransaction,
    }),
    [isSafe, safeAddress, chainId, isProposing, proposeTransaction]
  );
}

export default useSafeProposal;
