// src/utils/safe.ts

/** Narrow unknown to array (works with readonly arrays too). */
export function isArray<T = unknown>(x: unknown): x is T[] {
  return Array.isArray(x);
}

/** Coerce any value to an array (undefined/null -> []). */
export function toArray<T = unknown>(x: unknown): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

/**
 * No-throw .find:
 * - Returns undefined if `arr` is not an array
 * - Uses the same predicate signature as Array.prototype.find
 */
export function safeFind<T>(
  arr: unknown,
  pred: (v: T, i: number, a: T[]) => boolean
): T | undefined {
  if (!Array.isArray(arr)) return undefined;
  for (let i = 0; i < (arr as T[]).length; i++) {
    const v = (arr as T[])[i];
    if (pred(v, i, arr as T[])) return v;
  }
  return undefined;
}

/**
 * No-throw .some (handy when you only need a boolean guard).
 */
export function safeSome<T>(
  arr: unknown,
  pred: (v: T, i: number, a: T[]) => boolean
): boolean {
  if (!Array.isArray(arr)) return false;
  for (let i = 0; i < (arr as T[]).length; i++) {
    const v = (arr as T[])[i];
    if (pred(v, i, arr as T[])) return true;
  }
  return false;
}
