import { useMemo } from 'react';
import { determineRoute, generateRFQQuotes, RFQQuote } from '../lib/rfqMock';
import { useAMMQuote } from './useAMMQuote';
import { ARC_USDC_ADDRESS } from '../config/arc';

/**
 * Combine the on-chain AMM quote with a simulated RFQ pool so the UI can show
 * "Hybrid AMM + RFQ" routing as part of Obscura's pitch. RFQ here is purely
 * client-side — there is no on-chain RFQ execution path on Arc Testnet yet.
 */
export function useTradeRouter(
    tokenInAddress: string | undefined,
    tokenOutAddress: string | undefined,
    amountIn: string,
    tokenInSymbol: string,
    tokenOutSymbol: string,
    decimalsIn: number,
    decimalsOut: number
) {
    const ammQuote = useAMMQuote(
        tokenInAddress,
        tokenOutAddress,
        amountIn,
        decimalsIn,
        decimalsOut,
        ARC_USDC_ADDRESS
    );

    const usdValue = parseFloat(amountIn || '0');

    const routeType = useMemo(() => {
        if (!amountIn || parseFloat(amountIn) === 0) return null;
        return determineRoute(usdValue);
    }, [usdValue, amountIn]);

    const rfqQuotes = useMemo<RFQQuote[]>(() => {
        if (!routeType || routeType === 'AMM') return [];
        if (!ammQuote.amountOut) return [];
        const ammRate = ammQuote.amountOut / parseFloat(amountIn || '1');
        return generateRFQQuotes(
            tokenInSymbol,
            tokenOutSymbol,
            parseFloat(amountIn || '0'),
            1,
            ammRate
        );
    }, [routeType, ammQuote.amountOut, amountIn, tokenInSymbol, tokenOutSymbol]);

    const bestQuote = useMemo(() => {
        if (routeType === 'AMM' || !rfqQuotes.length) {
            return {
                source: 'AMM' as const,
                amountOut: ammQuote.amountOut,
                priceImpact: ammQuote.priceImpact,
            };
        }

        const bestRFQ = rfqQuotes[0];
        if (bestRFQ.amountOut > ammQuote.amountOut) {
            return {
                source: 'RFQ' as const,
                amountOut: bestRFQ.amountOut,
                priceImpact: 0,
                rfqQuote: bestRFQ,
            };
        }

        return {
            source: 'AMM' as const,
            amountOut: ammQuote.amountOut,
            priceImpact: ammQuote.priceImpact,
        };
    }, [routeType, rfqQuotes, ammQuote]);

    return {
        routeType,
        ammQuote,
        rfqQuotes,
        bestQuote,
        hasLiquidity: ammQuote.hasLiquidity,
    };
}
