import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { OBSCURA_AMM_ABI } from '../config/dexConfig';
import { OBSCURA_AMM_ADDRESS } from '../config/arc';
import { PYTH_PRICE_IDS } from '../config/priceFeeds';
import { getPythPriceUpdate, getPythUpdateFee } from '../lib/pythClient';

export interface UsePythSwapResult {
    executePythSwap: (params: {
        fromToken: `0x${string}`;
        toToken: `0x${string}`;
        fromSymbol: string;
        toSymbol: string;
        amountIn: string;
        decimalsIn: number;
        minAmountOut: bigint;
    }) => Promise<void>;
    isPending: boolean;
    isConfirming: boolean;
    isSuccess: boolean;
    error: Error | null;
    hash?: `0x${string}`;
}

/**
 * Pyth-fresh swap path: pulls signed price updates from Hermes, then calls
 * `swapWithPriceUpdate` on ObscuraAMM so the trade settles at the most recent
 * oracle price. The user pays the per-update fee in native USDC (msg.value).
 *
 * Use this for high-value swaps where you want guaranteed price freshness.
 * For routine swaps the regular `swap()` path on ObscuraAMM is cheaper because
 * it relies on whatever feed update was published most recently.
 */
export function usePythSwap(): UsePythSwapResult {
    const [error, setError] = useState<Error | null>(null);

    const {
        writeContract,
        data: hash,
        isPending,
        error: writeError,
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const executePythSwap = async ({
        fromToken,
        toToken,
        fromSymbol,
        toSymbol,
        amountIn,
        decimalsIn,
        minAmountOut,
    }: Parameters<UsePythSwapResult['executePythSwap']>[0]) => {
        try {
            setError(null);

            const ids: string[] = [];
            const symA = (PYTH_PRICE_IDS as Record<string, string>)[fromSymbol];
            const symB = (PYTH_PRICE_IDS as Record<string, string>)[toSymbol];
            if (symA) ids.push(symA);
            if (symB) ids.push(symB);

            // If neither leg has a Pyth feed (e.g. USDC on either side and the
            // counter-asset isn't tracked) fall back to plain swap().
            const priceUpdate = ids.length > 0 ? await getPythPriceUpdate(ids) : [];
            const fee = getPythUpdateFee(priceUpdate.length);

            const amountBN = parseUnits(amountIn, decimalsIn);

            writeContract({
                address: OBSCURA_AMM_ADDRESS,
                abi: OBSCURA_AMM_ABI,
                functionName: 'swapWithPriceUpdate',
                args: [
                    fromToken,
                    toToken,
                    amountBN,
                    minAmountOut,
                    priceUpdate as readonly `0x${string}`[],
                ],
                value: fee,
            });
        } catch (err) {
            const errorMsg = err instanceof Error ? err : new Error('Unknown error');
            setError(errorMsg);
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
