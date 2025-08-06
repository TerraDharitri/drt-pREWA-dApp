// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates if a string is a valid, positive number for blockchain transactions.
 * Allows integers and decimals. Rejects empty strings, non-numeric characters,
 * multiple decimal points, or values equal to or less than zero.
 * @param value The string value from an input field.
 * @returns True if the string is a valid positive number, false otherwise.
 */
export function isValidNumberInput(value: string): boolean {
  if (!value || value.trim() === '') return false;
  // Regex to allow numbers and a single decimal point.
  const validNumberRegex = /^[0-9]*\.?[0-9]*$/;
  if (!validNumberRegex.test(value) || value.trim() === '.') {
      return false;
  }
  const parsed = parseFloat(value);
  return !isNaN(parsed) && parsed > 0;
}