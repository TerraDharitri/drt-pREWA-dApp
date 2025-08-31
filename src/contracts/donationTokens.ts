// src/contracts/donationTokens.ts
import type { Address } from "viem";

/** Tokens shown in the Donate selector (separate from LP staking). */
export type DonationToken = {
  symbol: string;
  /** null => native coin (BNB on BSC). undefined => hide (not configured) */
  address: Address | null | undefined;
  /** If omitted, decimals are read on-chain. */
  decimals?: number;
};

// Keep native even if no address; hide undefined entries.
const keepVisible = (list: DonationToken[]) => list.filter(t => t.address !== undefined);

/** Toggle tokens per chain via .env.local variables. */
export const DONATION_TOKENS_BY_CHAIN: Record<number, DonationToken[]> = {
  // BSC Testnet (97)
  97: keepVisible([
    { symbol: "BNB",   address: null, decimals: 18 },
    { symbol: "pREWA", address: process.env.NEXT_PUBLIC_PREWA_97 as Address, decimals: 18 },
    { symbol: "USDT",  address: process.env.NEXT_PUBLIC_USDT_97 as Address },
    { symbol: "USDC",  address: process.env.NEXT_PUBLIC_USDC_97 as Address },
    { symbol: "DAI",   address: process.env.NEXT_PUBLIC_DAI_97 as Address },
    { symbol: "ETH",   address: process.env.NEXT_PUBLIC_ETH_97 as Address },
    { symbol: "WBTC",  address: process.env.NEXT_PUBLIC_WBTC_97 as Address },
    { symbol: "LINK",  address: process.env.NEXT_PUBLIC_LINK_97 as Address },
    { symbol: "UNI",   address: process.env.NEXT_PUBLIC_UNI_97 as Address },
    { symbol: "AAVE",  address: process.env.NEXT_PUBLIC_AAVE_97 as Address },
  ]),

  // BSC Mainnet (56)
  56: keepVisible([
    { symbol: "BNB",   address: null, decimals: 18 },
    { symbol: "pREWA", address: process.env.NEXT_PUBLIC_PREWA_56 as Address, decimals: 18 },
    { symbol: "USDT",  address: process.env.NEXT_PUBLIC_USDT_56 as Address },
    { symbol: "USDC",  address: process.env.NEXT_PUBLIC_USDC_56 as Address },
    { symbol: "DAI",   address: process.env.NEXT_PUBLIC_DAI_56 as Address },
    { symbol: "ETH",   address: process.env.NEXT_PUBLIC_ETH_56 as Address },
    { symbol: "WBTC",  address: process.env.NEXT_PUBLIC_WBTC_56 as Address },
    { symbol: "LINK",  address: process.env.NEXT_PUBLIC_LINK_56 as Address },
    { symbol: "UNI",   address: process.env.NEXT_PUBLIC_UNI_56 as Address },
    { symbol: "AAVE",  address: process.env.NEXT_PUBLIC_AAVE_56 as Address },
  ]),
};

export function getDonationTokensForChain(chainId: number): DonationToken[] {
  return DONATION_TOKENS_BY_CHAIN[chainId] ?? [{ symbol: "BNB", address: null, decimals: 18 }];
}