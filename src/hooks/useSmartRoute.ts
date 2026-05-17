import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { OBSCURA_RFQ_ABI } from '../config/rfqConfig';
import { OBSCURA_RFQ_ADDRESS, IS_RFQ_DEPLOYED } from '../config/arc';
import { isRfqAvailable, requestQuotes, type SignedQuote } from '../lib/rfqMaker';
import { chargeRfqQuote } from '../lib/nanopayClient';
import { getMockPrice } from '../lib/priceOracle';

/**
 * Trade-size threshold (in USD) above which we route through RFQ.
 *
 * In production this should be ~$100k (per the original spec) so RFQ only
 * kicks in for institutional-sized flow that benefits from competing maker
 * quotes. For the testnet demo we keep it intentionally low (~$1k) so judges
 * can demonstrate the full RFQ path without holding $100k of testnet USDC.
 *
 * Override at deploy time via `VITE_RFQ_MIN_USD` if you want to demo the
 * higher production threshold.
 */
const RFQ_MIN_USD: number = (() => {
    const raw = (import.meta as any).env?.VITE_RFQ_MIN_USD;
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1_000;
})();

export interface SmartQuote {
    /** Where the trade should execute. */
    route: 'RFQ' | 'AMM';
    /** Output amount in raw units of `tokenOut` (matches `decimalsOut`). */
    amountOut: bigint;
    /** Set when the route is RFQ — used by SwapTab to call settle(). */
    rfq?: SignedQuote;
    /** All competing RFQ quotes (best first). Used by the UI to show losers. */
    rfqAll?: SignedQuote[];
    /** Reason RFQ was skipped, surfaced to the UI for transparency. */
    rfqSkipReason?: string;
    /** Estimated USD value of the trade (input side). */
    tradeUsd: number;
    /** Threshold the trade must clear to engage RFQ. */
    rfqMinUsd: number;
}

interface UseSmartRouteParams {
    taker: `0x${string}` | undefined;
    tokenIn: `0x${string}` | undefined;
    tokenOut: `0x${string}` | undefined;
    /** Symbol of the input token; used to estimate USD trade size. */
    tokenInSymbol: string | undefined;
    amountIn: string;          // human-readable
    decimalsIn: number;
    decimalsOut: number;
    /** AMM quote already computed by `useAMMQuote`; we use it as fallback. */
    ammAmountOut: bigint | undefined;
    enabled: boolean;
}

/**
 * Smart router hook.
 *
 * Strategy (in order):
 *   1. If trade USD value is below `RFQ_MIN_USD` ($1k for testing, $100k for
 *      production), default to AMM. RFQ adds latency and Nanopay charges
 *      that aren't worth it for small trades.
 *   2. Otherwise, pull `fairAmountOut` from ObscuraRFQ (Pyth-derived).
 *   3. Ask the maker pool for signed quotes that improve on `fairAmountOut`.
 *   4. If the best RFQ quote beats the AMM quote, return route=RFQ.
 *   5. Otherwise (or if RFQ is unavailable), return route=AMM.
 *
 * Debounced 250ms on amount changes so the maker pool isn't called per
 * keystroke.
 */
export function useSmartRoute(params: UseSmartRouteParams): {
    quote: SmartQuote | null;
    isFetching: boolean;
} {
    const {
        taker,
        tokenIn,
        tokenOut,
        tokenInSymbol,
        amountIn,
        decimalsIn,
        decimalsOut,
        ammAmountOut,
        enabled,
    } = params;

    const amountInBN = (() => {
        if (!enabled || !amountIn) return undefined;
        try {
            return parseUnits(amountIn, decimalsIn);
        } catch {
            return undefined;
        }
    })();

    // Estimate USD value of the trade input. We use the off-chain mock/Pyth
    // price for this gate; it's intentionally rough — the on-chain Pyth
    // ceiling check still defends the actual settlement.
    const tradeUsd = (() => {
        if (!amountIn || !tokenInSymbol) return 0;
        const amount = Number(amountIn);
        if (!Number.isFinite(amount) || amount <= 0) return 0;
        const price = getMockPrice(tokenInSymbol);
        return amount * price;
    })();

    const meetsRfqThreshold = tradeUsd >= RFQ_MIN_USD;

    // Only fetch the on-chain fair price when the trade is large enough to
    // route through RFQ. Saves an RPC call on every small swap.
    const { data: fairAmountOut } = useReadContract({
        address: OBSCURA_RFQ_ADDRESS,
        abi: OBSCURA_RFQ_ABI,
        functionName: 'fairAmountOut',
        args:
            IS_RFQ_DEPLOYED && meetsRfqThreshold && tokenIn && tokenOut && amountInBN
                ? [tokenIn, tokenOut, amountInBN]
                : undefined,
        query: {
            enabled:
                IS_RFQ_DEPLOYED && meetsRfqThreshold && !!tokenIn && !!tokenOut && !!amountInBN,
        },
    });

    const [quote, setQuote] = useState<SmartQuote | null>(null);
    const [isFetching, setFetching] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            if (!enabled || !amountInBN || !tokenIn || !tokenOut || !taker) {
                setQuote(null);
                return;
            }

            // No AMM amount and no RFQ -> nothing to quote.
            if (!ammAmountOut || ammAmountOut === 0n) {
                setQuote(null);
                return;
            }

            const ammRoute: SmartQuote = {
                route: 'AMM',
                amountOut: ammAmountOut,
                tradeUsd,
                rfqMinUsd: RFQ_MIN_USD,
            };

            // 1. Trade size gate — anything under threshold takes the AMM
            //    fast path. We surface this clearly so judges/users see why
            //    we didn't bother fetching maker quotes.
            if (!meetsRfqThreshold) {
                setQuote({
                    ...ammRoute,
                    rfqSkipReason: `Trade < $${RFQ_MIN_USD.toLocaleString()} threshold`,
                });
                return;
            }

            if (!IS_RFQ_DEPLOYED) {
                setQuote({ ...ammRoute, rfqSkipReason: 'RFQ not deployed' });
                return;
            }
            if (!isRfqAvailable()) {
                setQuote({ ...ammRoute, rfqSkipReason: 'No maker configured' });
                return;
            }
            if (!fairAmountOut || fairAmountOut === 0n) {
                setQuote({ ...ammRoute, rfqSkipReason: 'Awaiting Pyth fair price' });
                return;
            }

            setFetching(true);
            try {
                const quotes = await requestQuotes({
                    taker,
                    tokenIn,
                    tokenOut,
                    amountIn: amountInBN,
                    fairAmountOut: fairAmountOut as bigint,
                });
                if (cancelled) return;

                if (quotes.length === 0) {
                    setQuote({ ...ammRoute, rfqSkipReason: 'No maker responded' });
                    return;
                }

                // Charge the user's nanopay channel for each quote we
                // received. Fire-and-forget — failure to charge does not
                // block the swap.
                quotes.forEach((q) => {
                    chargeRfqQuote(taker, q.maker).catch((e) =>
                        console.warn('[nanopay] charge failed', e)
                    );
                });

                const best = quotes[0];
                if (best.amountOut > ammAmountOut) {
                    setQuote({
                        route: 'RFQ',
                        amountOut: best.amountOut,
                        rfq: best,
                        rfqAll: quotes,
                        tradeUsd,
                        rfqMinUsd: RFQ_MIN_USD,
                    });
                } else {
                    setQuote({
                        ...ammRoute,
                        rfqAll: quotes,
                        rfqSkipReason: 'AMM beat RFQ this round',
                    });
                }
            } catch (e) {
                console.warn('[smartRoute]', e);
                if (!cancelled) setQuote({ ...ammRoute, rfqSkipReason: 'Maker error' });
            } finally {
                if (!cancelled) setFetching(false);
            }
        }

        // 250 ms debounce on amount changes.
        const t = setTimeout(run, 250);
        return () => {
            cancelled = true;
            clearTimeout(t);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        enabled,
        amountIn,
        tokenIn,
        tokenOut,
        tokenInSymbol,
        taker,
        decimalsIn,
        decimalsOut,
        ammAmountOut?.toString(),
        fairAmountOut?.toString(),
        meetsRfqThreshold,
    ]);

    return { quote, isFetching };
}

/** Exposed so SwapTab can show "Need $X more for RFQ" hint. */
export function getRfqThresholdUsd(): number {
    return RFQ_MIN_USD;
}
