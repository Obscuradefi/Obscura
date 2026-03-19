// Mock RFQ (Request for Quote) System
// Simulates competitive market maker quotes for demo purposes

export interface RFQQuote {
    id: string;
    maker: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: number;
    amountOut: number;
    rate: number;
    feePercent: number;
    expiryTime: number; // timestamp
    expirySeconds: number; // countdown
}

const MARKET_MAKERS = [
    'Wintermute',
    'Jump Trading',
    'Citadel Securities',
    'Jane Street',
    'Flow Traders',
];

/**
 * Generate mock RFQ quotes from simulated market makers
 * Quotes have slightly better pricing than AMM for large trades
 */
export function generateRFQQuotes(
    tokenIn: string,
    tokenOut: string,
    amountIn: number,
    basePrice: number, // Reference price from API
    ammPrice: number, // AMM pool price
): RFQQuote[] {
    const quotes: RFQQuote[] = [];
    const numQuotes = Math.floor(Math.random() * 2) + 2; // 2-3 quotes

    for (let i = 0; i < numQuotes; i++) {
        const maker = MARKET_MAKERS[Math.floor(Math.random() * MARKET_MAKERS.length)];

        // RFQ offers better price than AMM (1-3% improvement)
        const improvement = 1 + (Math.random() * 0.03); // 1.00 to 1.03
        const ammRate = ammPrice;
        const rfqRate = ammRate * improvement;

        const amountOut = amountIn * rfqRate;

        // Fee is tighter than AMM (0.01-0.05%)
        const feePercent = 0.0001 + Math.random() * 0.0004;

        // Expiry: 15-30 seconds
        const expirySeconds = 15 + Math.floor(Math.random() * 15);
        const expiryTime = Date.now() + expirySeconds * 1000;

        quotes.push({
            id: `rfq-${Date.now()}-${i}`,
            maker,
            tokenIn,
            tokenOut,
            amountIn,
            amountOut: amountOut * (1 - feePercent),
            rate: rfqRate,
            feePercent,
            expiryTime,
            expirySeconds,
        });
    }

    // Sort by best rate (highest amountOut)
    return quotes.sort((a, b) => b.amountOut - a.amountOut);
}

/**
 * Determine routing based on trade size
 */
export function determineRoute(usdValue: number): 'AMM' | 'RFQ' | 'HYBRID' {
    if (usdValue < 100_000) {
        return 'AMM'; // Small trades: AMM only
    } else if (usdValue < 500_000) {
        return 'HYBRID'; // Medium trades: Show both AMM + RFQ
    } else {
        return 'RFQ'; // Large trades: RFQ only
    }
}
