// src/providers/SafeProvider.tsx

"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import SafeAppsSDK, { SafeInfo } from '@safe-global/safe-apps-sdk';
import { SafeAppProvider } from '@safe-global/safe-apps-provider';
import { EIP1193Provider } from 'viem';

interface SafeContextType {
  sdk: SafeAppsSDK | null;
  safe: SafeInfo | null;
  isSafe: boolean;
  safeProvider: EIP1193Provider | null;
  isSafeReady: boolean; // <-- ADD THIS: To track if the check is complete
}

const SafeContext = createContext<SafeContextType>({
  sdk: null,
  safe: null,
  isSafe: false,
  safeProvider: null,
  isSafeReady: false, // <-- ADD THIS: Default to false
});

export const useSafe = () => useContext(SafeContext);

export const SafeProvider = ({ children }: { children: ReactNode }) => {
  const [sdk, setSdk] = useState<SafeAppsSDK | null>(null);
  const [safe, setSafe] = useState<SafeInfo | null>(null);
  const [isSafe, setIsSafe] = useState(false);
  const [safeProvider, setSafeProvider] = useState<EIP1193Provider | null>(null);
  const [isSafeReady, setIsSafeReady] = useState(false); // <-- ADD THIS

  useEffect(() => {
    const initSafe = async () => {
      try {
        const safeSDK = new SafeAppsSDK();
        const safeInfo = await safeSDK.safe.getInfo();
        
        if (safeInfo) {
          setSdk(safeSDK);
          setSafe(safeInfo);
          setIsSafe(true);
          setSafeProvider(new SafeAppProvider(safeInfo, safeSDK) as EIP1193Provider);
        }
      } catch (error) {
        console.log("Not running in a Safe App context.");
        setIsSafe(false);
      } finally {
        // <-- ADD THIS: Mark the check as complete, regardless of outcome
        setIsSafeReady(true);
      }
    };

    initSafe();
  }, []);

  return (
    <SafeContext.Provider value={{ sdk, safe, isSafe, safeProvider, isSafeReady }}>
      {children}
    </SafeContext.Provider>
  );
};