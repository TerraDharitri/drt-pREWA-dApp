// src/providers/SafeProvider.tsx

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import SafeAppsSDK, { SafeInfo } from '@safe-global/safe-apps-sdk';
import { SafeAppProvider } from '@safe-global/safe-apps-provider';
import { EIP1193Provider } from 'viem';

// Define the shape of our context
interface SafeContextType {
  sdk: SafeAppsSDK | null;
  safe: SafeInfo | null;
  isSafe: boolean;
  safeProvider: EIP1193Provider | null;
}

// Create the context with a default value
const SafeContext = createContext<SafeContextType>({
  sdk: null,
  safe: null,
  isSafe: false,
  safeProvider: null,
});

// Create a custom hook for easy access to the context
export const useSafe = () => useContext(SafeContext);

// Create the provider component
export const SafeProvider = ({ children }: { children: ReactNode }) => {
  const [sdk, setSdk] = useState<SafeAppsSDK | null>(null);
  const [safe, setSafe] = useState<SafeInfo | null>(null);
  const [isSafe, setIsSafe] = useState(false);
  const [safeProvider, setSafeProvider] = useState<EIP1193Provider | null>(null);

  useEffect(() => {
    const initSafe = async () => {
      try {
        const safeSDK = new SafeAppsSDK();
        const safeInfo = await safeSDK.safe.getInfo();
        
        if (safeInfo) {
          setSdk(safeSDK);
          setSafe(safeInfo);
          setIsSafe(true);
          
          // FIX: Use a type assertion to tell TypeScript that SafeAppProvider is compatible with EIP1193Provider.
          // This resolves the complex type mismatch between the two libraries.
          setSafeProvider(new SafeAppProvider(safeInfo, safeSDK) as EIP1193Provider);
        }
      } catch (error) {
        console.log("Not running in a Safe App context.");
        setIsSafe(false);
      }
    };

    initSafe();
  }, []);

  return (
    <SafeContext.Provider value={{ sdk, safe, isSafe, safeProvider }}>
      {children}
    </SafeContext.Provider>
  );
};