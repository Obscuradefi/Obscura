// Obscura RFQ configuration.
//
// ABI mirrors `contracts/ObscuraRFQ.sol`. The maker private key lives in the
// browser via `VITE_RFQ_MAKER_PRIVATE_KEY` (local-dev only) or in a remote
// quote API in production. For the hackathon demo we keep it on the client
// behind a `dev`-only flag so we can show end-to-end flow without spinning up
// a separate backend.

export const OBSCURA_RFQ_ABI = [
  {
    type: 'function',
    name: 'settle',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'quoteId', type: 'bytes32' },
      { name: 'maker', type: 'address' },
      { name: 'taker', type: 'address' },
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOut', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'fairAmountOut',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'isMaker',
    stateMutability: 'view',
    inputs: [{ name: 'maker', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'maxDeviationBps',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint16' }],
  },
  {
    type: 'function',
    name: 'filled',
    stateMutability: 'view',
    inputs: [{ name: 'quoteId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'event',
    name: 'Settled',
    inputs: [
      { name: 'quoteId', type: 'bytes32', indexed: true },
      { name: 'maker', type: 'address', indexed: true },
      { name: 'taker', type: 'address', indexed: true },
      { name: 'tokenIn', type: 'address', indexed: false },
      { name: 'tokenOut', type: 'address', indexed: false },
      { name: 'amountIn', type: 'uint256', indexed: false },
      { name: 'amountOut', type: 'uint256', indexed: false },
    ],
  },
] as const;

// EIP-712 domain + types — must match the contract constructor exactly.
export const RFQ_EIP712_DOMAIN = {
  name: 'ObscuraRFQ',
  version: '1',
} as const;

export const RFQ_EIP712_TYPES = {
  Quote: [
    { name: 'quoteId', type: 'bytes32' },
    { name: 'maker', type: 'address' },
    { name: 'taker', type: 'address' },
    { name: 'tokenIn', type: 'address' },
    { name: 'tokenOut', type: 'address' },
    { name: 'amountIn', type: 'uint256' },
    { name: 'amountOut', type: 'uint256' },
    { name: 'expiry', type: 'uint256' },
  ],
} as const;

/** Default tightening on top of the on-chain Pyth fair price (in bps). */
export const RFQ_DEFAULT_IMPROVEMENT_BPS = 5; // 0.05%
