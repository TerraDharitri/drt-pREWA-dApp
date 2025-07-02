import { pREWAContracts } from '@/contracts/addresses';
import AccessControl from '@/contracts/abis/AccessControl.json';
import ContractRegistry from '@/contracts/abis/ContractRegistry.json';
import EmergencyController from '@/contracts/abis/EmergencyController.json';
import LiquidityManager from '@/contracts/abis/LiquidityManager.json';
import LPStaking from '@/contracts/abis/LPStaking.json';
import OracleIntegration from '@/contracts/abis/OracleIntegration.json';
import pREWAToken from '@/contracts/abis/PREWAToken.json';
import PriceGuard from '@/contracts/abis/PriceGuard.json';
import ProxyAdmin from '@/contracts/abis/ProxyAdmin.json';
import SecurityModule from '@/contracts/abis/SecurityModule.json';
import TokenStaking from '@/contracts/abis/TokenStaking.json';

export const pREWAAddresses = pREWAContracts;

// CORRECTED: We now correctly export the 'abi' property from each imported JSON file.
export const pREWAAbis = {
  AccessControl: AccessControl.abi,
  ContractRegistry: ContractRegistry.abi,
  EmergencyController: EmergencyController.abi,
  LiquidityManager: LiquidityManager.abi,
  LPStaking: LPStaking.abi,
  OracleIntegration: OracleIntegration.abi,
  pREWAToken: pREWAToken.abi,
  PriceGuard: PriceGuard.abi,
  ProxyAdmin: ProxyAdmin.abi,
  SecurityModule: SecurityModule.abi,
  TokenStaking: TokenStaking.abi,
};