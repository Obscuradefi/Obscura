

export interface RFQQuote {
    id: string;
    maker: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: number;
    amountOut: number;
    rate: number;
    feePercent: number;
    expiryTime: number; 
    expirySeconds: number; 
}

const MARKET_MAKERS = [
    'Wintermute',
    'Jump Trading',
    'Citadel Securities',
    'Jane Street',
    'Flow Traders',
];

export function generateRFQQuotes(
    tokenIn: string,
    tokenOut: string,
    amountIn: number,
    basePrice: number, 
    ammPrice: number, 
): RFQQuote[] {
    const quotes: RFQQuote[] = [];
    const numQuotes = Math.floor(Math.random() * 2) + 2; 

    for (let i = 0; i < numQuotes; i++) {
        const maker = MARKET_MAKERS[Math.floor(Math.random() * MARKET_MAKERS.length)];

        
        const improvement = 1 + (Math.random() * 0.03); 
        const ammRate = ammPrice;
        const rfqRate = ammRate * improvement;

        const amountOut = amountIn * rfqRate;

        
        const feePercent = 0.0001 + Math.random() * 0.0004;

        
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

    
    return quotes.sort((a, b) => b.amountOut - a.amountOut);
}

export function determineRoute(usdValue: number): 'AMM' | 'RFQ' | 'HYBRID' {
    if (usdValue < 100_000) {
        return 'AMM'; 
    } else if (usdValue < 500_000) {
        return 'HYBRID'; 
    } else {
        return 'RFQ'; 
    }
}
