// src/contracts/addresses.ts

// NOTE: Add the ProtocolAdminSafe address for mainnet and testnet.
// Use the same address as the VestingFactory owner for consistency.

export const pREWAContracts = {
  56: { // BSC Mainnet
    AccessControl: '0x3a0a36a5df68047a1ea2510104914c3e5ab0358a',
    ContractRegistry: '0x0a0f29bbbe12c9db6f5d1c968c4c9ce71737c1ea',
    EmergencyController: '0xb4fe5047284dbd99eb78ca053c719b40c65dcc48',
    EmergencyTimelockController: '0x52468d6a9abbf4e72bbf2603ceed882b5c3b9157',
    LiquidityManager: '0x5a36f36d7387acd2d8c7e8a35372f20cb6910d12',
    LPStaking: '0xc7055816c1c70785667cee051bc7d207e6ffb633',
    OracleIntegration: '0xa6a0e83c6d5bef2a674c038d78657124a928dd01',
    pREWAToken: '0x828f07e624f227fde5906611461deab26dccc600',
    PriceGuard: '0x957b4b03c9e343f5818b2d0574f756d8efab9fcb',
    ProxyAdmin: '0x963e958cb843dd184cc155a81fec8e7d1faf94b2',
    SecurityModule: '0x97697ee096a75c198c7c46e4aaf3ba46f80bf0d4',
    TokenStaking: '0x98021cf19ac7c2be39c74acc07c17e5796d243fe',
    VestingFactory: '0x2c7b26bdc9ec33bd69d5f685bcb749a2e8180197',
    PancakeRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    ProtocolAdminSafe: "0xb3F5449b9594EC1B62d17B61ddf33f26B97c31E8",
  },
  97: { // BSC Testnet
    AccessControl: '0xAda6B10b552Cee862B08F0014a0c6597b4A80Dc7',
    ContractRegistry: '0x7809F6CcCa785E55EFb8F5F25cEC88Ab2ae05bB9',
    EmergencyController: '0x1c0009b41A4147F278A8FF10a7Bc14FBFbf0544B',
    EmergencyTimelockController: '0x2B5D7158ddfa644b3E33bB2bFb99b6C5D9b3a6BE',
    LiquidityManager: '0xF699b6d664f74dd6ADCFd65cc93A1A8Bf945fB28',
    LPStaking: '0x65A1d668638d0eeAd1B7c2FcCEF2bFaBD3B74407',
    OracleIntegration: '0x5a7EF74d7b9Ab5D10b7A4deB12d350e647A04d2c',
    pREWAToken: '0x0440b0893167f66e49a82eF6F3b4c2Aed7fe10Bf',
    PriceGuard: '0xc3cfee4FB47795cac5c0086dF3790c365965757a',
    ProxyAdmin: '0x093F09816cE244a664cc1f5F6A7D1F6AeaC11178',
    SecurityModule: '0xa0732dDF4a9ABb9dc36cC6C77c17b8a8A59CC437',
    TokenStaking: '0xF7a5FAE59E91BCE350404F5a173936fae7c83E9b',
    VestingFactory: '0x5F7F833c911C0607cEf7aD31BE839ef07939E7b4',
    PancakeRouter: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
    ProtocolAdminSafe: "0x...",
  },
} as const;

export type ContractName = keyof typeof pREWAContracts[56];