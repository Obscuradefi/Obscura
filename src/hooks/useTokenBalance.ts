import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { ERC20_ABI } from '../config/dexConfig';

export function useTokenBalance(tokenAddress: string | undefined, userAddress: string | undefined) {
    const { data: balance, refetch } = useReadContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!tokenAddress && !!userAddress,
            refetchInterval: 5000, // Auto-refresh every 5 seconds
        },
    });

    const formattedBalance = balance !== undefined ? parseFloat(formatUnits(balance, 18)) : 0;

    return {
        balance,
        formattedBalance,
        refetch,
    };
}
