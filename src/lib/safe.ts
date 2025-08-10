// src/lib/safe.ts
export function isInSafeApp(): boolean {
  // ❗ SSR / prerender: no window/document available
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  const ref = document.referrer || "";
  if (/\bapp\.safe\.global\b/i.test(ref) || /\.\bsafe\.global\b/i.test(ref)) return true;

  const ao = (document as any).ancestorOrigins as unknown;
  if (ao && typeof (ao as { length?: number }).length === "number") {
    const origins = Array.from(ao as string[]);
    if (origins.some((o) => /\bapp\.safe\.global\b/i.test(String(o)) || /\.\bsafe\.global\b/i.test(String(o)))) {
      return true;
    }
  }
  // being in an iframe alone isn't definitive, so ignore it here
  return false;
}
