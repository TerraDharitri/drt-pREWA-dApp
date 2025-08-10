// src/lib/isSafe.ts
export function isInSafeApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const embedded = window.parent && window.parent !== window;
    const ref = document.referrer || "";
    const looksLikeSafe = /(^https:\/\/)(.*\.)?safe\.global(\/|$)/i.test(ref);
    return embedded && looksLikeSafe;
  } catch {
    // Cross-origin access can throw—treat as not in Safe
    return false;
  }
}
