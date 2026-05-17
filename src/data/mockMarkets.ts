

export interface MarketData {
    symbol: string;
    price: number;
    change24h: number;
    volume24h: number;
}

// Approximate spot prices as of the build date. Replaced live by
// `usePriceFeed` / `fetchAssetPrices` in MarketsTab when Hermes is reachable.
export const MOCK_MARKETS: MarketData[] = [
    {
        symbol: 'USDC',
        price: 1.00,
        change24h: 0.01,
        volume24h: 2_500_000,
    },
    {
        symbol: 'EURC',
        price: 1.08,
        change24h: 0.22,
        volume24h: 1_125_000,
    },
    {
        symbol: 'JPYC',
        price: 1 / 150,
        change24h: -0.18,
        volume24h: 685_000,
    },
    {
        symbol: 'GOLD',
        price: 4500.00,
        change24h: 1.25,
        volume24h: 350_000,
    },
    {
        symbol: 'AAPL',
        price: 220.00,
        change24h: -0.85,
        volume24h: 275_000,
    },
    {
        symbol: 'MSTR',
        price: 1700.00,
        change24h: 3.45,
        volume24h: 180_000,
    },
];

export function getMarketData(symbol: string): MarketData | undefined {
    return MOCK_MARKETS.find((m) => m.symbol === symbol);
}
