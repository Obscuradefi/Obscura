import { useMemo } from 'react';
import { determineRoute, generateRFQQuotes, RFQQuote } from '../lib/rfqMock';
import { useAMMQuote } from './useAMMQuote';

/**
 * Hook to route trades between AMM and RFQ based on trade size
 */
export function useTradeRouter(
    tokenInAddress: string | undefined,
    tokenOutAddress: string | undefined,
    amountIn: string,
    tokenInSymbol: string,
    tokenOutSymbol: string
) {
    // Get AMM quote
    const ammQuote = useAMMQuote(tokenInAddress, tokenOutAddress, amountIn);

    // Estimate USD value (simplified: assume input token ~= $1)
    const usdValue = parseFloat(amountIn || '0');

    // Determine routing strategy
    const routeType = useMemo(() => {
        if (!amountIn || parseFloat(amountIn) === 0) return null;
        return determineRoute(usdValue);
    }, [usdValue, amountIn]);

    // Generate RFQ quotes for medium/large trades
    const rfqQuotes = useMemo<RFQQuote[]>(() => {
        if (!routeType || routeType === 'AMM') return [];
        if (!ammQuote.amountOut) return [];

        const ammRate = ammQuote.amountOut / parseFloat(amountIn || '1');
        return generateRFQQuotes(
            tokenInSymbol,
            tokenOutSymbol,
            parseFloat(amountIn || '0'),
            1, // Base price (simplified)
            ammRate
        );
    }, [routeType, ammQuote.amountOut, amountIn, tokenInSymbol, tokenOutSymbol]);

    // Best quote selection
    const bestQuote = useMemo(() => {
        if (routeType === 'AMM' || !rfqQuotes.length) {
            return {
                source: 'AMM' as const,
                amountOut: ammQuote.amountOut,
                priceImpact: ammQuote.priceImpact,
            };
        }

        // Compare AMM vs best RFQ
        const bestRFQ = rfqQuotes[0]; // Already sorted by best rate
        if (bestRFQ.amountOut > ammQuote.amountOut) {
            return {
                source: 'RFQ' as const,
                amountOut: bestRFQ.amountOut,
                priceImpact: 0, // RFQ has no slippage
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
