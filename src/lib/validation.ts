// src/lib/validation.ts

// A strict regex to ensure the string is a valid decimal number.
const VALID_AMOUNT_REGEX = /^\d*\.?\d*$/;

/**
 * Checks if a string is a valid, positive number for amount inputs.
 * Allows for empty strings during user input but considers them invalid for transactions.
 * @param amount The string value from an input field.
 * @returns True if the amount is a valid, positive number.
 */
export const isValidAmount = (amount: string): boolean => {
  if (amount.trim() === '' || amount === '.') return false;
  // Ensure the format is valid AND it's a number greater than 0.
  return VALID_AMOUNT_REGEX.test(amount) && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
};