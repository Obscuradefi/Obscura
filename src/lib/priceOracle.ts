/**
 * Price Oracle - Pyth Network Integration
 * Unified price fetching from Pyth Network for all assets
 */

import { PYTH_PRICE_IDS } from '../config/priceFeeds';

// ============================================
// PYTH NETWORK (ALL ASSETS)
// ============================================

export async function fetchPythPrice(symbol: string): Promise<number> {
    try {
        const priceId = PYTH_PRICE_IDS[symbol];
        if (!priceId) {
            throw new Error(`No Pyth price ID for ${symbol}`);
        }

        const hermesUrl = (import.meta as any).env.VITE_PYTH_HERMES_URL || 'https://hermes.pyth.network';

        const response = await fetch(
            `${hermesUrl}/v2/updates/price/latest?ids[]=${priceId}`
        );

        if (!response.ok) {
            throw new Error(`Pyth API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.parsed || data.parsed.length === 0) {
            throw new Error('No price data from Pyth');
        }

        const priceData = data.parsed[0].price;

        // Convert from Pyth format: price * 10^expo
        const price = Number(priceData.price) * Math.pow(10, priceData.expo);

        return price;
    } catch (error) {
        console.error(`Failed to fetch ${symbol} price from Pyth:`, error);
        return getMockPrice(symbol);
    }
}

// Fallback mock prices
function getMockPrice(symbol: string): number {
    const mockPrices: Record<string, number> = {
        'AAPL': 278.12,
        'MSTR': 134.93,
        'USDT': 1.0,
        'USDe': 1.0,
        'USDO': 1.0,
        'GOLD': 5077.0,
    };
    return mockPrices[symbol] || 1.0;
}

// ============================================
// UNIFIED FETCH FUNCTION
// ============================================

export async function fetchAssetPrice(symbol: string): Promise<number> {
    // All assets now use Pyth Network!
    return fetchPythPrice(symbol);
}
