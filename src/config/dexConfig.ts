// SimpleSwap DEX Configuration
// Contract: 0x79b575397552f71Bc37d978DF8F75650B05f635a (Base Sepolia)

export const SIMPLE_SWAP_ADDRESS = '0x79b575397552f71Bc37d978DF8F75650B05f635a' as const;

// SimpleSwap Contract ABI
export const SIMPLE_SWAP_ABI = [
    {
        type: 'function',
        name: 'swap',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_tokenIn', type: 'address' },
            { name: '_tokenOut', type: 'address' },
            { name: '_amount', type: 'uint256' },
        ],
        outputs: [],
    },
    {
        type: 'function',
        name: 'withdrawToken',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_token', type: 'address' },
            { name: '_amount', type: 'uint256' },
        ],
        outputs: [],
    },
    {
        type: 'event',
        name: 'TokensSwapped',
        inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'tokenIn', type: 'address', indexed: false },
            { name: 'tokenOut', type: 'address', indexed: false },
            { name: 'amountIn', type: 'uint256', indexed: false },
            { name: 'amountOut', type: 'uint256', indexed: false },
        ],
    },
] as const;

// ============================================
// SIMPLE AMM CONTRACT (Automated Market Maker)
// ============================================

// SimpleAMM Contract (Deployed on Base Sepolia) - BASIC 1:1 RATIO (No Pyth)
export const SIMPLE_AMM_ADDRESS = '0x944b6cB6d8621603B4a094955123dbD96e289bA2' as const;

export const SIMPLE_AMM_ABI = [
    {
        type: 'function',
        name: 'swap',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'tokenIn', type: 'address' },
            { name: 'tokenOut', type: 'address' },
            { name: 'amountIn', type: 'uint256' },
            { name: 'minAmountOut', type: 'uint256' },
        ],
        outputs: [],
    },
    {
        type: 'function',
        name: 'swapWithPyth',
        stateMutability: 'payable',
        inputs: [
            { name: 'tokenIn', type: 'address' },
            { name: 'tokenOut', type: 'address' },
            { name: 'amountIn', type: 'uint256' },
            { name: 'minAmountOut', type: 'uint256' },
            { name: 'priceUpdateData', type: 'bytes[]' },
        ],
        outputs: [],
    },
    {
        type: 'function',
        name: 'addLiquidity',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'token', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [],
    },
    {
        type: 'function',
        name: 'removeLiquidity',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'token', type: 'address' },
            { name: 'shares', type: 'uint256' },
        ],
        outputs: [],
    },
    {
        type: 'function',
        name: 'getAmountOut',
        stateMutability: 'view',
        inputs: [
            { name: 'tokenIn', type: 'address' },
            { name: 'tokenOut', type: 'address' },
            { name: 'amountIn', type: 'uint256' },
        ],
        outputs: [{ name: 'amountOut', type: 'uint256' }],
    },
    {
        type: 'function',
        name: 'getPrice',
        stateMutability: 'view',
        inputs: [
            { name: 'tokenIn', type: 'address' },
            { name: 'tokenOut', type: 'address' },
        ],
        outputs: [{ name: 'price', type: 'uint256' }],
    },
    {
        type: 'function',
        name: 'reserves',
        stateMutability: 'view',
        inputs: [{ name: 'token', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        type: 'function',
        name: 'liquidityShares',
        stateMutability: 'view',
        inputs: [
            { name: 'provider', type: 'address' },
            { name: 'token', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        type: 'function',
        name: 'totalShares',
        stateMutability: 'view',
        inputs: [{ name: 'token', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        type: 'event',
        name: 'Swap',
        inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'tokenIn', type: 'address', indexed: true },
            { name: 'tokenOut', type: 'address', indexed: true },
            { name: 'amountIn', type: 'uint256', indexed: false },
            { name: 'amountOut', type: 'uint256', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'LiquidityAdded',
        inputs: [
            { name: 'provider', type: 'address', indexed: true },
            { name: 'token', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false },
            { name: 'shares', type: 'uint256', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'LiquidityRemoved',
        inputs: [
            { name: 'provider', type: 'address', indexed: true },
            { name: 'token', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false },
            { name: 'shares', type: 'uint256', indexed: false },
        ],
    },
] as const;

// ERC20 ABI for approve and balanceOf
export const ERC20_ABI = [
    {
        type: 'function',
        name: 'approve',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        type: 'function',
        name: 'allowance',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        type: 'function',
        name: 'balanceOf',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        type: 'function',
        name: 'decimals',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
    },
] as const;
