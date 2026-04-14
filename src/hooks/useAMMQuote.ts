import { useReadContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { SIMPLE_AMM_ABI, SIMPLE_AMM_ADDRESS } from '../config/dexConfig';

export function useAMMQuote(
    tokenInAddress: string | undefined,
    tokenOutAddress: string | undefined,
    amountIn: string
) {
    
    const { data: amountOutBN, refetch } = useReadContract({
        address: SIMPLE_AMM_ADDRESS,
        abi: SIMPLE_AMM_ABI,
        functionName: 'getAmountOut',
        args:
            tokenInAddress && tokenOutAddress && amountIn
                ? [
                    tokenInAddress as `0x${string}`,
                    tokenOutAddress as `0x${string}`,
                    parseUnits(amountIn, 18),
                ]
                : undefined,
        query: {
            enabled: !!tokenInAddress && !!tokenOutAddress && !!amountIn && parseFloat(amountIn) > 0,
        },
    });

    
    const { data: reserveIn } = useReadContract({
        address: SIMPLE_AMM_ADDRESS,
        abi: SIMPLE_AMM_ABI,
        functionName: 'reserves',
        args: tokenInAddress ? [tokenInAddress as `0x${string}`] : undefined,
        query: { enabled: !!tokenInAddress },
    });

    const { data: reserveOut } = useReadContract({
        address: SIMPLE_AMM_ADDRESS,
        abi: SIMPLE_AMM_ABI,
        functionName: 'reserves',
        args: tokenOutAddress ? [tokenOutAddress as `0x${string}`] : undefined,
        query: { enabled: !!tokenOutAddress },
    });

    const amountOut = amountOutBN ? parseFloat(formatUnits(amountOutBN, 18)) : 0;
    const hasLiquidity = reserveIn && reserveOut && reserveIn > 0n && reserveOut > 0n;

    
    let priceImpact = 0;
    if (hasLiquidity && amountIn && parseFloat(amountIn) > 0) {
        const amountInNum = parseFloat(amountIn);
        const reserveInNum = parseFloat(formatUnits(reserveIn, 18));
        priceImpact = (amountInNum / (reserveInNum + amountInNum)) * 100;
    }

    return {
        amountOut,
        amountOutBN,
        hasLiquidity,
        reserveIn: reserveIn ? parseFloat(formatUnits(reserveIn, 18)) : 0,
        reserveOut: reserveOut ? parseFloat(formatUnits(reserveOut, 18)) : 0,
        priceImpact,
        refetch,
    };
}
