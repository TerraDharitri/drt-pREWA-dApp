// utils/isSafeApp.ts
export async function isSafeApp(): Promise<boolean> {
  // quick check: embedded iframe
  if (typeof window === "undefined") return false;
  if (window.self === window.top) return false;

  // robust check using postMessage ping expected by Safe
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 600);
    // minimal ping – Safe SDK handles this for you; this is just a light precheck
    clearTimeout(timeout);
    return true; // we’ll let the Safe SDK failover if not inside Safe
  } catch {
    return false;
  }
}
