// src/contracts/abis/Safe.ts

// Using "as const" is crucial for wagmi to correctly infer the return types.
export const safeAbi = [
  {
    "constant": true,
    "inputs": [],
    "name": "getOwners",
    "outputs": [{ "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function",
  }
] as const;