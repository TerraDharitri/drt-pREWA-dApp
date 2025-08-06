// src/providers/SafeProvider.tsx

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import SafeAppsSDK, { SafeInfo } from '@safe-global/safe-apps-sdk';
import { SafeAppProvider } from '@safe-global/safe-apps-provider';
// FIX: Corrected the casing of the imported type from 'Eip1193Provider' to 'EIP1193Provider'
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
        // The getInfo method will throw an error if not in a Safe context, which is what we want.
        const safeInfo = await safeSDK.safe.getInfo();
        
        if (safeInfo) {
          setSdk(safeSDK);
          setSafe(safeInfo);
          setIsSafe(true);
          setSafeProvider(new SafeAppProvider(safeInfo, safeSDK));
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