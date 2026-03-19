// Mock market data for Markets tab

export interface MarketData {
    symbol: string;
    price: number;
    change24h: number;  // Percentage
    volume24h: number;
}

export const MOCK_MARKETS: MarketData[] = [
    {
        symbol: 'USDO',
        price: 1.00,
        change24h: 0.02,
        volume24h: 1250000,
    },
    {
        symbol: 'USDT',
        price: 1.00,
        change24h: -0.01,
        volume24h: 985000,
    },
    {
        symbol: 'USDe',
        price: 1.01,
        change24h: 0.15,
        volume24h: 420000,
    },
    {
        symbol: 'GOLD',
        price: 2050.75,
        change24h: 1.25,
        volume24h: 350000,
    },
    {
        symbol: 'AAPL',
        price: 178.50,
        change24h: -0.85,
        volume24h: 275000,
    },
    {
        symbol: 'MSTR',
        price: 425.30,
        change24h: 3.45,
        volume24h: 180000,
    },
];

export function getMarketData(symbol: string): MarketData | undefined {
    return MOCK_MARKETS.find(m => m.symbol === symbol);
}
