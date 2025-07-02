// NOTE: Replace these with your actual deployed contract addresses
// Addresses are per chainId
// 56 for BSC Mainnet, 97 for BSC Testnet

export const pREWAContracts = {
  56: { // BSC Mainnet
    AccessControl: '0x...',
    ContractRegistry: '0x...',
    EmergencyController: '0x...',
    EmergencyTimelockController: '0x...',
    LiquidityManager: '0x...',
    LPStaking: '0x...',
    OracleIntegration: '0x...',
    pREWAToken: '0x...',
    PriceGuard: '0x...',
    ProxyAdmin: '0x...',
    SecurityModule: '0x...',
    TokenStaking: '0x...',
    VestingFactory: '0x...',
  },
  97: { // BSC Testnet
    AccessControl: '0x...',
    ContractRegistry: '0x...',
    EmergencyController: '0x...',
    EmergencyTimelockController: '0x...',
    LiquidityManager: '0x...',
    LPStaking: '0x...',
    OracleIntegration: '0x...',
    pREWAToken: '0x...',
    PriceGuard: '0x...',
    ProxyAdmin: '0x...',
    SecurityModule: '0x...',
    TokenStaking: '0x...',
    VestingFactory: '0x...',
  },
} as const;

export type ContractName = keyof typeof pREWAContracts[56];