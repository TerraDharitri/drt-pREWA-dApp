// src/constants/tokens.ts

import { Address } from "viem";
import { pREWAContracts } from "@/contracts/addresses";
import {
  TOKEN_ADDRESSES,
  type DharitriChainId,
} from "@/contracts/addresses";

export type Token = {
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
  logoURI: string;
};

// --- Mainnet (ChainId 56) ---
const PREWA_MAINNET_ADDRESS: Address = pREWAContracts[56].pREWAToken;
const USDT_MAINNET_ADDRESS: Address = "0x55d398326f99059fF775485246999027B3197955";

export const TOKEN_LIST_MAINNET: Token[] = [
  // (kept minimal for backward compatibility)
  {
    symbol: "pREWA",
    name: "pREWA Token",
    address: PREWA_MAINNET_ADDRESS,
    decimals: 18,
    logoURI: "/images/graphics/logo/Dharitri Logo dark.svg",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: USDT_MAINNET_ADDRESS,
    decimals: 18,
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  },
];

// --- Testnet (ChainId 97) ---
const PREWA_TESTNET_ADDRESS: Address = pREWAContracts[97].pREWAToken;
const USDT_TESTNET_ADDRESS: Address = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";

export const TOKEN_LIST_TESTNET: Token[] = [
  // (kept minimal for backward compatibility)
  {
    symbol: "pREWA",
    name: "pREWA Token",
    address: PREWA_TESTNET_ADDRESS,
    decimals: 18,
    logoURI: "/images/graphics/logo/Dharitri Logo dark.svg",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: USDT_TESTNET_ADDRESS,
    decimals: 18,
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  },
];

// --- LP Token Definitions ---
export const LP_TOKEN_LISTS: { [chainId: number]: Token[] } = {
  56: [ // Mainnet
    {
      symbol: "pREWA-USDT LP",
      name: "PancakeSwap pREWA-USDT LP",
      address: "0x53b0486292ff813cc794465279c9BB8feFf2b964",
      decimals: 18,
      logoURI: "/logo.svg",
    }
  ],
  97: [ // Testnet
    {
      symbol: "pREWA-USDT LP",
      name: "PancakeSwap pREWA-USDT LP",
      address: "0xb01c948466512e8cfC2881D52911c6A1a62eD21a",
      decimals: 18,
      logoURI: "/logo.svg",
    }
  ]
};

// ---------------------------------------------------------------------------
// Canonical, full token lists built from addresses.ts (single source of truth)
// ---------------------------------------------------------------------------

const ORDER = [
  "USDT","USDC","DAI","ETH","BTCB","LINK","AAVE","UNI","ADA","XRP","EGLD","DOT","DOGE","PREWA",
] as const;

const DECIMALS: Record<(typeof ORDER)[number], number> = {
  USDC: 18, USDT: 18, PREWA: 18, DAI: 18, ETH: 18, BTCB: 18, LINK: 18,
  DOGE: 8, ADA: 18, UNI: 18, XRP: 18, EGLD: 18, AAVE: 18, DOT: 18,
};

const LOGO: Record<(typeof ORDER)[number], string> = {
  USDC: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
  USDT: "https://assets.coingecko.com/coins/images/325/small/Tether-logo.png",
  PREWA: "/logo.svg",
  DAI:  "https://assets.coingecko.com/coins/images/9956/small/4943.png",
  ETH:  "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  BTCB:  "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  LINK: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  DOGE: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  ADA:  "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  UNI:  "https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png",
  XRP:  "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  EGLD: "https://assets.coingecko.com/coins/images/12335/small/Elrond.png",
  AAVE: "https://assets.coingecko.com/coins/images/12645/small/AAVE.png",
  DOT:  "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
};

function buildList(chainId: DharitriChainId): Token[] {
  const map = TOKEN_ADDRESSES[chainId];
  return ORDER
    .filter((s) => map[s as keyof typeof map]) // only configured tokens
    .map((s) => ({
      symbol: s,
      name:
        s === "ETH" ? "Binance-Peg ETH" :
        s === "BTCB" ? "BTCB" :
        s === "PREWA" ? "Dharitri pREWA" : s,
      address: map[s as keyof typeof map] as Address,
      decimals: DECIMALS[s],
      logoURI: LOGO[s],
    }));
}

// Canonical lists (recommended for new UI)
export const TOKEN_LISTS_CANONICAL: { [chainId: number]: Token[] } = {
  56: buildList(56 as DharitriChainId),
  97: buildList(97 as DharitriChainId),
};

// Back-compat exports so existing code keeps working
export const TOKEN_LIST_MAINNET_FULL: Token[] = TOKEN_LISTS_CANONICAL[56];
export const TOKEN_LIST_TESTNET_FULL: Token[] = TOKEN_LISTS_CANONICAL[97];
export const TOKEN_LISTS: { [chainId: number]: Token[] } = {
  56: TOKEN_LIST_MAINNET,   // legacy minimal list
  97: TOKEN_LIST_TESTNET,   // legacy minimal list
};

// Convenience accessor (use this for new code)
export function tokensForChain(chainId: DharitriChainId): Token[] {
  return TOKEN_LISTS_CANONICAL[chainId] || [];
}