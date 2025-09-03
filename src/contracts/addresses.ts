// src/contracts/addresses.ts
import type { Address } from "viem";

// NOTE: Add the ProtocolAdminSafe address for mainnet and testnet.
// Use the same address as the VestingFactory owner for consistency.

export const pREWAContracts = {
  56: { // BSC Mainnet
    AccessControl: '0x3a0a36a5df68047a1ea2510104914c3e5ab0358a' as Address,
    ContractRegistry: '0x0a0f29bbbe12c9db6f5d1c968c4c9ce71737c1ea' as Address,
    EmergencyController: '0xb4fe5047284dbd99eb78ca053c719b40c65dcc48' as Address,
    EmergencyTimelockController: '0x52468d6a9abbf4e72bbf2603ceed882b5c3b9157' as Address,
    LiquidityManager: '0x5a36f36d7387acd2d8c7e8a35372f20cb6910d12' as Address,
    LPStaking: '0xc7055816c1c70785667cee051bc7d207e6ffb633' as Address,
    Donation: '0x99C5D7b71b30687A8754750129bA8570009276E9' as Address,
    OracleIntegration: '0xa6a0e83c6d5bef2a674c038d78657124a928dd01' as Address,
    pREWAToken: '0x828f07e624f227fde5906611461deab26dccc600' as Address,
    PriceGuard: '0x957b4b03c9e343f5818b2d0574f756d8efab9fcb' as Address,
    ProxyAdmin: '0x963e958cb843dd184cc155a81fec8e7d1faf94b2' as Address,
    SecurityModule: '0x97697ee096a75c198c7c46e4aaf3ba46f80bf0d4' as Address,
    TokenStaking: '0x98021cf19ac7c2be39c74acc07c17e5796d243fe' as Address,
    VestingFactory: '0x2c7b26bdc9ec33bd69d5f685bcb749a2e8180197' as Address,
    PancakeRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E' as Address,
    ProtocolAdminSafe: '0xb3F5449b9594EC1B62d17B61ddf33f26B97c31E8' as Address, // ✅ mainnet
  },
  97: { // BSC Testnet
    AccessControl: '0xAda6B10b552Cee862B08F0014a0c6597b4A80Dc7' as Address,
    ContractRegistry: '0x7809F6CcCa785E55EFb8F5F25cEC88Ab2ae05bB9' as Address,
    EmergencyController: '0x1c0009b41A4147F278A8FF10a7Bc14FBFbf0544B' as Address,
    EmergencyTimelockController: '0x2B5D7158ddfa644b3E33bB2bFb99b6C5D9b3a6BE' as Address,
    LiquidityManager: '0xF699b6d664f74dd6ADCFd65cc93A1A8Bf945fB28' as Address,
    LPStaking: '0x65A1d668638d0eeAd1B7c2FcCEF2bFaBD3B74407' as Address,
    DonationTracker: '0x53F0F3A3aeC235556837510EC71969dA3b1b4Aa2' as Address,
    Donation: '0x53F0F3A3aeC235556837510EC71969dA3b1b4Aa2' as Address,
    OracleIntegration: '0x5a7EF74d7b9Ab5D10b7A4deB12d350e647A04d2c' as Address,
    pREWAToken: '0x0440b0893167f66e49a82eF6F3b4c2Aed7fe10Bf' as Address,
    PriceGuard: '0xc3cfee4FB47795cac5c0086dF3790c365965757a' as Address,
    ProxyAdmin: '0x093F09816cE244a664cc1f5F6A7D1F6AeaC11178' as Address,
    SecurityModule: '0xa0732dDF4a9ABb9dc36cC6C77c17b8a8A59CC437' as Address,
    TokenStaking: '0xF7a5FAE59E91BCE350404F5a173936fae7c83E9b' as Address,
    VestingFactory: '0x5F7F833c911C0607cEf7aD31BE839ef07939E7b4' as Address,
    PancakeRouter: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1' as Address,
    ProtocolAdminSafe: '0xd80F79d95b6520C8a5125df9ea669e5f6DA48969' as Address, // ✅ testnet
  },
} as const;

export type ContractName = keyof typeof pREWAContracts[56];

// ---------- Single source of truth for donation tokens ----------
export type DharitriChainId = 56 | 97;
export type TokenSymbol =
  | "USDC" | "USDT" | "PREWA" | "DAI" | "ETH" | "BTCB" | "LINK"
  | "DOGE" | "ADA" | "UNI" | "XRP" | "EGLD" | "AAVE" | "DOT";

export const TOKEN_ADDRESSES: Record<DharitriChainId, Record<TokenSymbol, Address>> = {
  97: {
    USDC: "0x64544969ed7EBf5f083679233325356EbE738930" as Address,
    USDT: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" as Address,
    PREWA:"0x0440b0893167f66e49a82eF6F3b4c2Aed7fe10Bf" as Address,
    DAI:  "0xEC5dCb5Dbf4B114c9d0F65BcCAb49EC54F6A0867" as Address,
    ETH:  "0xd66c6B4F0be8CE5b39D52E0Fd1344c389929B378" as Address,
    BTCB:  "0x6ce8dA28E2f864420840cF74474eFf5fD80E65B8" as Address,
    LINK: "0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06" as Address,
    DOGE: "0xA3C7900feb72cD31Ff39796f361C5Df3c5F5CB8f" as Address,
    ADA:  "0x2D1E7bC0F96BB9C36b30dfd8f044Efe1DDD034Da" as Address,
    UNI:  "0x4b5eac9c6e6c956c7c46c845bb52d05d8a7c89c5" as Address,
    XRP:  "0xa83575490D7df4E2F47b7D38ef351a2722cA45b9" as Address,
    EGLD: "0x77759A1eAd9b46d0a7a393962b9a19523a54d33a" as Address,
    AAVE: "0x9AFBc0bd6c141D3947a1DAB2393270333e5EcCCa" as Address,
    DOT:  "0x2B821203c2dFaAff3CF5f49469500Db1332372Eb" as Address,
  },
  56: {
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" as Address,
    USDT: "0x55d398326f99059fF775485246999027B3197955" as Address,
    PREWA:"0x828f07e624f227fde5906611461deab26dccc600" as Address,
    DAI:  "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3" as Address,
    ETH:  "0x2170Ed0880ac9A755fd29B2688956BD959F933F8" as Address,
    BTCB:  "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c" as Address,
    LINK: "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD" as Address,
    DOGE: "0xbA2aE424d960c26247Dd6c32edC70B295c744C43" as Address,
    ADA:  "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47" as Address,
    UNI:  "0xBf5140A22578168FD562DCcF235E5D43A02ce9B1" as Address,
    XRP:  "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE" as Address,
    EGLD: "0xbF7c81FFF98BbE61B40Ed186e4AfD6DDd01337fe" as Address,
    AAVE: "0xfb6115445Bff7b52FeB98650C87f44907E58f802" as Address,
    DOT:  "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402" as Address,
  },
};

// Swap pair (centralized)
export const SWAP_PAIR: Record<DharitriChainId, Address> = {
  97: "0xb01c948466512e8cfC2881D52911c6A1a62eD21a" as Address,
  56: "0x53b0486292ff813cc794465279c9BB8feFf2b964" as Address,
};

// ---------- Typed helpers ----------
export function getContractAddress<N extends ContractName>(
  chainId: DharitriChainId,
  name: N
): Address {
  // @ts-ignore - indexed access on const
  const a: Address | undefined = pREWAContracts[chainId][name];
  if (!a) throw new Error(`Missing address for ${name} on chainId ${chainId}`);
  return a;
}

export function getDonationAddress(chainId: DharitriChainId): Address {
  // Prefer the in-file mapping; env fallback while mainnet Donation is placeholder
  // @ts-ignore - indexed access on const
  const configured = (pREWAContracts as any)[chainId].Donation as Address;
  const isPlaceholder = String(configured).startsWith("0xYOUR_");
  if (!isPlaceholder && !/^0x0{40}$/i.test(configured)) return configured;

  const env = process.env[`NEXT_PUBLIC_DONATION_${chainId}` as const] as Address | undefined;
  if (!env) throw new Error(`Donation address missing for chainId ${chainId}`);
  return env;
}

export function getTokenAddress(
  chainId: DharitriChainId,
  symbol: TokenSymbol
): Address {
  const a = TOKEN_ADDRESSES[chainId][symbol];
  if (!a) throw new Error(`Token ${symbol} not configured on chain ${chainId}`);
  return a;
}

export function getSwapPairAddress(chainId: DharitriChainId): Address {
  return SWAP_PAIR[chainId];
}