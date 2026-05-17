// Obscura Nanopayments — sub-cent USDC channels for agent billing.
//
// Use case in Obscura:
//   - Agent opens a channel funded with USDC, payee = RFQ maker (or LLM
//     service, or Pyth pusher).
//   - Each off-chain micro-event (quote fetched, intent parsed, price pushed)
//     adds to a running total signed by the payer's session key.
//   - Payee batches up signed claims and settles on-chain whenever it makes
//     economic sense.
//
// ABI mirrors `contracts/ObscuraNanopay.sol`. EIP-712 domain matches the
// constructor — keep these in sync if you ever rev the contract.

export const OBSCURA_NANOPAY_ABI = [
  {
    type: 'function',
    name: 'openChannel',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'payee', type: 'address' },
      { name: 'deposit', type: 'uint256' },
      { name: 'salt', type: 'bytes32' },
    ],
    outputs: [{ name: 'channelId', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'topUp',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'channelId', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claim',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'channelId', type: 'bytes32' },
      { name: 'totalSpent', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'closeChannel',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'channelId', type: 'bytes32' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'sweep',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'channelId', type: 'bytes32' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'channels',
    stateMutability: 'view',
    inputs: [{ name: 'channelId', type: 'bytes32' }],
    outputs: [
      { name: 'payer', type: 'address' },
      { name: 'payee', type: 'address' },
      { name: 'deposited', type: 'uint128' },
      { name: 'claimed', type: 'uint128' },
      { name: 'closesAt', type: 'uint64' },
      { name: 'open', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'balance',
    stateMutability: 'view',
    inputs: [{ name: 'channelId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'quoteId',
    stateMutability: 'pure',
    inputs: [
      { name: 'payer', type: 'address' },
      { name: 'payee', type: 'address' },
      { name: 'salt', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'event',
    name: 'ChannelOpened',
    inputs: [
      { name: 'channelId', type: 'bytes32', indexed: true },
      { name: 'payer', type: 'address', indexed: true },
      { name: 'payee', type: 'address', indexed: true },
      { name: 'deposit', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ChannelClaim',
    inputs: [
      { name: 'channelId', type: 'bytes32', indexed: true },
      { name: 'payee', type: 'address', indexed: true },
      { name: 'increment', type: 'uint256', indexed: false },
      { name: 'totalSpent', type: 'uint256', indexed: false },
      { name: 'nonce', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const NANOPAY_EIP712_DOMAIN = {
  name: 'ObscuraNanopay',
  version: '1',
} as const;

export const NANOPAY_EIP712_TYPES = {
  ChannelClaim: [
    { name: 'channelId', type: 'bytes32' },
    { name: 'payer', type: 'address' },
    { name: 'payee', type: 'address' },
    { name: 'totalSpent', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

// Standard service rates Obscura uses inside the agent.
//
// All rates are in **raw USDC units** (6 decimals). `RFQ_QUOTE_RATE` of 1000
// means 0.001 USDC per quote, demonstrating sub-cent pricing.
export const NANOPAY_RATES = {
  /** Per RFQ quote fetched from a maker (multi-maker => multiplied). */
  RFQ_QUOTE_RATE: 1_000n,    // 0.001 USDC per quote
  /** Per Jatevo LLM intent parse. */
  LLM_PARSE_RATE: 500n,       // 0.0005 USDC per parse
  /** Per Pyth update pushed by the agent on the user's behalf. */
  PYTH_PUSH_RATE: 100n,       // 0.0001 USDC per push
} as const;

export const NANOPAY_DEFAULT_DEPOSIT = 100_000n; // 0.10 USDC opening deposit
