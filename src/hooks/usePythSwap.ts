/**
 * Pyth Oracle Swap Hook
 * Executes swaps with Pyth Network oracle pricing for accurate market rates
 */
import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { SIMPLE_AMM_ABI, SIMPLE_AMM_ADDRESS } from '../config/dexConfig';
import { PYTH_PRICE_IDS } from '../config/priceFeeds';
import { getPythPriceUpdate, getPythUpdateFee } from '../lib/pythClient';

interface UsePythSwapResult {
    executePythSwap: (params: {
        fromToken: string;
        toToken: string;
        fromSymbol: string;
        toSymbol: string;
        amountIn: string;
        minAmountOut: bigint;
    }) => Promise<void>;
    isPending: boolean;
    isConfirming: boolean;
    isSuccess: boolean;
    error: Error | null;
    hash?: `0x${string}`;
}

export function usePythSwap(): UsePythSwapResult {
    const [error, setError] = useState<Error | null>(null);

    const {
        writeContract,
        data: hash,
        isPending,
        error: writeError,
    } = useWriteContract();

    const {
        isLoading: isConfirming,
        isSuccess,
    } = useWaitForTransactionReceipt({ hash });

    const executePythSwap = async ({
        fromToken,
        toToken,
        fromSymbol,
        toSymbol,
        amountIn,
        minAmountOut,
    }: {
        fromToken: string;
        toToken: string;
        fromSymbol: string;
        toSymbol: string;
        amountIn: string;
        minAmountOut: bigint;
    }) => {
        try {
            setError(null);

            // Get Pyth price IDs
            const priceIds = [
                PYTH_PRICE_IDS[fromSymbol as keyof typeof PYTH_PRICE_IDS],
                PYTH_PRICE_IDS[toSymbol as keyof typeof PYTH_PRICE_IDS],
            ].filter(Boolean);

            if (priceIds.length !== 2) {
                throw new Error(`Missing Pyth price feeds for ${fromSymbol}/${toSymbol}`);
            }

            console.log('[PythSwap] Fetching price updates...');

            // Fetch Pyth price updates
            const priceUpdate = await getPythPriceUpdate(priceIds);
            const updateFee = getPythUpdateFee(priceIds.length);

            const amountBN = parseUnits(amountIn, 18);

            console.log('[PythSwap] Executing swapWithPyth() with oracle pricing...');

            // Execute swap with Pyth oracle
            writeContract({
                address: SIMPLE_AMM_ADDRESS,
                abi: SIMPLE_AMM_ABI,
                functionName: 'swapWithPyth',
                args: [
                    fromToken as `0x${string}`,
                    toToken as `0x${string}`,
                    amountBN,
                    minAmountOut,
                    priceUpdate as readonly `0x${string}`[],
                ],
                value: updateFee, // Pay Pyth update fee (~2 wei)
            });
        } catch (err) {
            const errorMsg = err instanceof Error ? err : new Error('Unknown error');
            setError(errorMsg);
            console.error('[PythSwap] Error:', errorMsg);
            throw errorMsg;
        }
    };

    return {
        executePythSwap,
        isPending,
        isConfirming,
        isSuccess,
        error: error || writeError || null,
        hash,
    };
}
