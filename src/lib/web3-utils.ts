import { formatUnits } from "viem";

export function formatAddress(address?: string): string {
  if (!address) return "0x000...0000";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBigInt(
  value: bigint | undefined,
  decimals: number = 18,
  precision: number = 4
): string {
  if (value === undefined) return "0.0";
  return parseFloat(formatUnits(value, decimals)).toFixed(precision);
}