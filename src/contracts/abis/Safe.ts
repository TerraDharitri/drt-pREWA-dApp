// src/contracts/abis/Safe.ts

// The "as const" assertion is essential. It tells TypeScript that this object and its properties will never change.
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