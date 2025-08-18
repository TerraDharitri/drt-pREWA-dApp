// src/lib/device.ts
"use client";

export const isMobileBrowser = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

// MetaMask in-app browser and desktop extensions inject `window.ethereum`
export const hasInjectedProvider = (): boolean =>
  typeof window !== "undefined" && !!(window as any).ethereum;