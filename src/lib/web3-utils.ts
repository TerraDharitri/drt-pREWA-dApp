import { formatUnits, Address } from "viem";
import { format } from 'date-fns';

/**
 * Formats a BigInt value from wei into a readable string with decimals.
 * @param value The BigInt value (e.g., in wei).
 * @param decimals The number of decimals the token uses (default: 18).
 * @param precision The number of decimal places to show in the output (default: 4).
 * @returns A formatted string like "1,234.5678".
 */
export function formatBigInt(
  value: bigint | undefined,
  decimals = 18,
  precision = 4
): string {
  if (value === undefined) {
    return Number(0).toFixed(precision);
  }
  
  const formattedString = formatUnits(value, decimals);
  const number = parseFloat(formattedString);
  
  return number.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

/**
 * Shortens a blockchain address to the format "0x123...abcd".
 * @param address The full address.
 * @returns A shortened address string.
 */
export function formatAddress(address: Address | undefined): string {
  if (!address) {
    return '...';
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Converts a Unix timestamp (in seconds) from a BigInt to a formatted date-time string.
 * @param timestamp The bigint timestamp from the blockchain.
 * @returns A formatted string like "dd/MM/yyyy, HH:mm:ss".
 */
export function formatTimestamp(timestamp: bigint): string {
  if (!timestamp || timestamp === 0n) {
    return 'N/A';
  }
  // Convert bigint seconds to a number of milliseconds for the Date constructor
  const date = new Date(Number(timestamp) * 1000);
  return format(date, 'dd/MM/yyyy, HH:mm:ss');
}