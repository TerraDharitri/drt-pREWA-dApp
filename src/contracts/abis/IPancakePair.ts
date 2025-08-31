// src/contracts/abis/IPancakePair.ts

// Minimal pair ABI (what we read in hooks)
export const IPancakePairABI = [
  {
    inputs: [],
    name: "token0",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token1",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getReserves",
    outputs: [
      { internalType: "uint112", name: "_reserve0", type: "uint112" },
      { internalType: "uint112", name: "_reserve1", type: "uint112" },
      { internalType: "uint32", name: "_blockTimestampLast", type: "uint32" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Typed Swap event for viem.getLogs({ event })
export const SwapEventABI = {
  anonymous: false,
  inputs: [
    { indexed: true,  internalType: "address", name: "sender",    type: "address" },
    { indexed: false, internalType: "uint256", name: "amount0In",  type: "uint256" },
    { indexed: false, internalType: "uint256", name: "amount1In",  type: "uint256" },
    { indexed: false, internalType: "uint256", name: "amount0Out", type: "uint256" },
    { indexed: false, internalType: "uint256", name: "amount1Out", type: "uint256" },
    { indexed: true,  internalType: "address", name: "to",         type: "address" },
  ],
  name: "Swap",
  type: "event",
} as const;

// Back-compat default export (optional)
export default IPancakePairABI;
