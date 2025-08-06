// src/constants/index.ts

import { pREWAContracts } from '@/contracts/addresses';
import AccessControl from '@/contracts/abis/AccessControl.json';
import ContractRegistry from '@/contracts/abis/ContractRegistry.json';
import EmergencyController from '@/contracts/abis/EmergencyController.json';
import EmergencyTimelockController from '@/contracts/abis/EmergencyTimelockController.json';
import ILiquidityManager from '@/contracts/abis/ILiquidityManager.json';
import ILPStaking from '@/contracts/abis/ILPStaking.json';
import IPancakeFactory from '@/contracts/abis/IPancakeFactory.json';
import IPancakePair from '@/contracts/abis/IPancakePair.json';
import IPancakeRouter from '@/contracts/abis/IPancakeRouter.json';
import IpREWAToken from '@/contracts/abis/IpREWAToken.json';
import IProxy from '@/contracts/abis/IProxy.json';
import ITokenStaking from '@/contracts/abis/ITokenStaking.json';
import IVesting from '@/contracts/abis/IVesting.json';
import IVestingFactory from '@/contracts/abis/IVestingFactory.json'; // The variable is named IVestingFactory
import LiquidityManager from '@/contracts/abis/LiquidityManager.json';
import LPStaking from '@/contracts/abis/LPStaking.json';
import OracleIntegration from '@/contracts/abis/OracleIntegration.json';
import PREWAToken from '@/contracts/abis/PREWAToken.json';
import PriceGuard from '@/contracts/abis/PriceGuard.json';
import ProxyAdmin from '@/contracts/abis/ProxyAdmin.json';
import SecurityModule from '@/contracts/abis/SecurityModule.json';
import TokenStaking from '@/contracts/abis/TokenStaking.json';
import VestingFactory from '@/contracts/abis/VestingFactory.json'; // This is the implementation ABI
import VestingImplementation from '@/contracts/abis/VestingImplementation.json';

// A minimal, strongly-typed ABI for Gnosis Safe
export const safeAbi = [
  {
    "constant": true,
    "inputs": [],
    "name": "getOwners",
    "outputs": [{ "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function",
  }
] as const; // "as const" is critical for type inference

export const pREWAAddresses = pREWAContracts;

export const pREWAAbis = {
  AccessControl: AccessControl.abi,
  ContractRegistry: ContractRegistry.abi,
  EmergencyController: EmergencyController.abi,
  EmergencyTimelockController: EmergencyTimelockController.abi,
  ILiquidityManager: ILiquidityManager.abi,
  ILPStaking: ILPStaking.abi,
  IPancakeFactory: IPancakeFactory.abi,
  IPancakePair: IPancakePair.abi,
  IPancakeRouter: IPancakeRouter.abi,
  IpREWAToken: IpREWAToken.abi,
  IProxy: IProxy.abi,
  ITokenStaking: ITokenStaking.abi,
  IVesting: IVesting.abi,
  IVestingFactory: IVestingFactory.abi, // FIX: Use the correct variable
  LiquidityManager: LiquidityManager.abi,
  LPStaking: LPStaking.abi,
  OracleIntegration: OracleIntegration.abi,
  pREWAToken: PREWAToken.abi,
  PriceGuard: PriceGuard.abi,
  ProxyAdmin: ProxyAdmin.abi,
  SecurityModule: SecurityModule.abi,
  TokenStaking: TokenStaking.abi,
  VestingFactory: VestingFactory.abi, // The implementation ABI
  VestingImplementation: VestingImplementation.abi,
  Safe: safeAbi, // The new, strongly-typed Safe ABI
};