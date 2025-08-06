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
const WBNB_MAINNET_ADDRESS: Address = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const USDT_MAINNET_ADDRESS: Address = "0x55d398326f99059fF775485246999027B3197955";
const BTCB_MAINNET_ADDRESS: Address = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c";
const ETH_MAINNET_ADDRESS: Address = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";
const PREWA_MAINNET_ADDRESS: Address = pREWAContracts[56].pREWAToken;

export const TOKEN_LIST_MAINNET: Token[] = [
  {
    symbol: "pREWA",
    name: "pREWA Token",
    address: PREWA_MAINNET_ADDRESS,
    decimals: 18,
    logoURI: "/images/graphics/logo/Dharitri Logo dark.svg",
  },
  {
    symbol: "BNB",
    name: "Binance Coin",
    address: WBNB_MAINNET_ADDRESS,
    decimals: 18,
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: USDT_MAINNET_ADDRESS,
    decimals: 18,
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  },
   {
    symbol: "BTCB",
    name: "Bitcoin BEP20",
    address: BTCB_MAINNET_ADDRESS,
    decimals: 18,
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BTCB-1DE/logo.png",
  },
  {
    symbol: "ETH",
    name: "Ethereum BEP20",
    address: ETH_MAINNET_ADDRESS,
    decimals: 18,
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  },
];

// --- Testnet (ChainId 97) ---
const WBNB_TESTNET_ADDRESS: Address = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const USDT_TESTNET_ADDRESS: Address = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
const BTCB_TESTNET_ADDRESS: Address = "0x6ce8dA28E2f864420840cF7447459f344A53d258";
const ETH_TESTNET_ADDRESS: Address = "0x8babbb98648b2349be35f3ee307074494af6c351";
const PREWA_TESTNET_ADDRESS: Address = pREWAContracts[97].pREWAToken;

export const TOKEN_LIST_TESTNET: Token[] = [
  {
    symbol: "pREWA",
    name: "pREWA Token",
    address: PREWA_TESTNET_ADDRESS,
    decimals: 18,
    logoURI: "/images/graphics/logo/Dharitri Logo dark.svg",
  },
  {
    symbol: "BNB",
    name: "Binance Coin",
    address: WBNB_TESTNET_ADDRESS,
    decimals: 18,
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: USDT_TESTNET_ADDRESS,
    decimals: 18,
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  },
   {
    symbol: "BTCB",
    name: "Bitcoin BEP20",
    address: BTCB_TESTNET_ADDRESS,
    decimals: 18,
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BTCB-1DE/logo.png",
  },
  {
    symbol: "ETH",
    name: "Ethereum BEP20",
    address: ETH_TESTNET_ADDRESS,
    decimals: 18,
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  },
];

export const TOKEN_LISTS: { [chainId: number]: Token[] } = {
  56: TOKEN_LIST_MAINNET,
  97: TOKEN_LIST_TESTNET,
};