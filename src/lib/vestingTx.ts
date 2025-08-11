// src/lib/vestingTx.ts
import type { Abi, Address, PublicClient } from 'viem';
import { encodeFunctionData, parseUnits, erc20Abi } from 'viem';
import VestingFactory from '@/contracts/abis/VestingFactory.json';

export type CreateVestingParams = {
  beneficiary: Address;
  amount: string;
  startDate?: Date | number;
  durationDays: number;
  cliffDays?: number;
  revocable: boolean;
  decimals?: number;
};

const DAY = 86_400n;

export function encodeCreateVestingData(
  params: CreateVestingParams
): `0x${string}` {
  const abi = (VestingFactory as { abi: Abi }).abi;

  if (!params.beneficiary) throw new Error('beneficiary is required');
  if (!params.amount || Number(params.amount) <= 0)
    throw new Error('amount must be greater than zero');
  if (!Number.isFinite(params.durationDays) || params.durationDays <= 0)
    throw new Error('durationDays must be > 0');

  const cliffDays = params.cliffDays ?? 0;
  if (cliffDays < 0) throw new Error('cliffDays cannot be negative');
  if (cliffDays > params.durationDays)
    throw new Error('cliffDays cannot be greater than durationDays');

  const nowSec = Math.floor(Date.now() / 1000);
  const startTimeSec =
    typeof params.startDate === 'number'
      ? BigInt(Math.floor(params.startDate))
      : params.startDate instanceof Date
      ? BigInt(Math.floor(params.startDate.getTime() / 1000))
      : BigInt(nowSec);

  const durationSec = BigInt(params.durationDays) * DAY;
  const cliffSec = BigInt(cliffDays) * DAY;

  const decimals = params.decimals ?? 18;
  const amountWei = parseUnits(params.amount, decimals);

  return encodeFunctionData({
    abi,
    functionName: 'createVesting',
    args: [
      params.beneficiary,
      startTimeSec,
      cliffSec,
      durationSec,
      params.revocable,
      amountWei,
    ],
  });
}

export function buildSafeCreateVestingTx(
  factoryAddress: Address,
  params: CreateVestingParams
) {
  const data = encodeCreateVestingData(params);
  return {
    to: factoryAddress,
    value: '0',
    data,
  };
}

export function buildWriteContractCall(
  factoryAddress: Address,
  params: CreateVestingParams
) {
  const abi = (VestingFactory as { abi: Abi }).abi;

  const nowSec = Math.floor(Date.now() / 1000);
  const startTimeSec =
    typeof params.startDate === 'number'
      ? BigInt(Math.floor(params.startDate))
      : params.startDate instanceof Date
      ? BigInt(Math.floor(params.startDate.getTime() / 1000))
      : BigInt(nowSec);

  const durationSec = BigInt(params.durationDays) * DAY;
  const cliffSec = BigInt(params.cliffDays ?? 0) * DAY;

  const decimals = params.decimals ?? 18;
  const amountWei = parseUnits(params.amount, decimals);

  return {
    address: factoryAddress,
    abi,
    functionName: 'createVesting' as const,
    args: [
      params.beneficiary,
      startTimeSec,
      cliffSec,
      durationSec,
      params.revocable,
      amountWei,
    ] as const,
  };
}

/**
 * Detect token decimals from the VestingFactory's configured token.
 * NOTE: decimals() returns a number in viem.
 */
export async function getFactoryTokenDecimals(
  publicClient: PublicClient,
  factoryAddress: Address
): Promise<number> {
  const abi = (VestingFactory as { abi: Abi }).abi;

  const tokenAddress = (await publicClient.readContract({
    address: factoryAddress,
    abi,
    functionName: 'getTokenAddress',
  })) as Address;

  const decimals = (await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
  })) as number;

  return decimals;
}
