// src/lib/device.ts
export const isMobileBrowser = () => {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const hasInjectedProvider = () =>
  typeof window !== "undefined" && !!(window as any).ethereum;
