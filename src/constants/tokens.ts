// src/constants/tokens.ts

import { Address } from "viem";
import { pREWAContracts } from "@/contracts/addresses";

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
  // ... (your existing tokens remain here)
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
  // ... (your existing tokens remain here)
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
      address: "0x53b0486292ff813cc794465279c9BB8feFf2b964", // Your verified mainnet LP address
      decimals: 18,
      logoURI: "/logo.svg", // Or a custom LP icon
    }
  ],
  97: [ // Testnet
     {
      symbol: "pREWA-USDT LP",
      name: "PancakeSwap pREWA-USDT LP",
      address: "0x53b0486292ff813cc794465279c9BB8feFf2b964", // Assuming testnet uses the same, update if different
      decimals: 18,
      logoURI: "/logo.svg",
    }
  ]
};

export const TOKEN_LISTS: { [chainId: number]: Token[] } = {
  56: TOKEN_LIST_MAINNET,
  97: TOKEN_LIST_TESTNET,
};