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
    { symbol: "pREWA", address: "0x0440b0893167f66e49a82eF6F3b4c2Aed7fe10Bf" as Address, decimals: 18 },
    { symbol: "USDT",  address: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" as Address },
    { symbol: "USDC",  address: "0x64544969ed7EBf5f083679233325356EbE738930" as Address },
    { symbol: "DAI",   address: "0xEC5dCb5Dbf4B114c9d0F65BcCAb49EC54F6A0867" as Address },
    { symbol: "ETH",   address: "0xd66c6B4F0be8CE5b39D52E0Fd1344c389929B378" as Address },
    { symbol: "BTCB",  address: "0x6ce8dA28E2f864420840cF74474eFf5fD80E65B8" as Address },
    { symbol: "LINK",  address: "0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06" as Address },
    { symbol: "UNI",   address: "0x4b5eac9c6e6c956c7c46c845bb52d05d8a7c89c5" as Address },
    { symbol: "AAVE",  address: "0x9AFBc0bd6c141D3947a1DAB2393270333e5EcCCa" as Address },
    { symbol: "DOGE",  address: "0xA3C7900feb72cD31Ff39796f361C5Df3c5F5CB8f" as Address },
    { symbol: "ADA",   address: "0x2D1E7bC0F96BB9C36b30dfd8f044Efe1DDD034Da" as Address },
    { symbol: "XRP",   address: "0xa83575490D7df4E2F47b7D38ef351a2722cA45b9" as Address },
    { symbol: "EGLD",  address: "0x77759A1eAd9b46d0a7a393962b9a19523a54d33a" as Address },
    { symbol: "DOT",   address: "0x2B821203c2dFaAff3CF5f49469500Db1332372Eb" as Address },
  ]),

  // BSC Mainnet (56)
  56: keepVisible([
    { symbol: "BNB",   address: null, decimals: 18 },
    { symbol: "pREWA", address: "0x828f07e624f227fde5906611461deab26dccc600" as Address, decimals: 18 },
    { symbol: "USDT",  address: "0x55d398326f99059fF775485246999027B3197955" as Address },
    { symbol: "USDC",  address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" as Address },
    { symbol: "DAI",   address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3" as Address },
    { symbol: "ETH",   address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8" as Address },
    { symbol: "BTCB",  address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c" as Address },
    { symbol: "LINK",  address: "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD" as Address },
    { symbol: "UNI",   address: "0xBf5140A22578168FD562DCcF235E5D43A02ce9B1" as Address },
    { symbol: "AAVE",  address: "0xfb6115445Bff7b52FeB98650C87f44907E58f802" as Address },
    { symbol: "DOGE",  address: "0xbA2aE424d960c26247Dd6c32edC70B295c744C43" as Address },
    { symbol: "ADA",   address: "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47" as Address },
    { symbol: "XRP",   address: "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE" as Address },
    { symbol: "EGLD",  address: "0xbF7c81FFF98BbE61B40Ed186e4AfD6DDd01337fe" as Address },
    { symbol: "DOT",   address: "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402" as Address },
  ]),
};

export function getDonationTokensForChain(chainId: number): DonationToken[] {
  return DONATION_TOKENS_BY_CHAIN[chainId] ?? [{ symbol: "BNB", address: null, decimals: 18 }];
}