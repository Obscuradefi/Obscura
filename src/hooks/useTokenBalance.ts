import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { ERC20_ABI } from '../config/dexConfig';

/**
 * Read an ERC-20 balance and format it using the token's own decimals.
 * On Arc Testnet, USDC is 6 decimals while mock equities/commodities are 18,
 * so callers MUST pass the correct value.
 */
export function useTokenBalance(
    tokenAddress: string | undefined,
    userAddress: string | undefined,
    decimals: number = 18
) {
    const { data: balance, refetch } = useReadContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: userAddress ? [userAddress as `0x${string}`] : undefined,
        query: {
            enabled: !!tokenAddress && !!userAddress,
            refetchInterval: 5000,
        },
    });

    const formattedBalance =
        balance !== undefined ? parseFloat(formatUnits(balance as bigint, decimals)) : 0;

    return {
        balance,
        formattedBalance,
        refetch,
    };
}
