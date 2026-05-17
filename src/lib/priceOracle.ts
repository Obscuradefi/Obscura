// Lightweight off-chain price oracle for Obscura's display layer.
//
// On-chain spot prices for tradable assets come from `ObscuraAMM.getPrice()`
// (which itself reads Pyth via `getPriceUnsafe`). This module is for the UI
// surfaces — Markets tab, portfolio USD totals, and the conditional-intent
// watcher in `SwapAgent` — where we want a fast, off-chain price even when
// the on-chain feed hasn't been pushed recently.
//
// Strategy:
//   1. Pull from Pyth Hermes (`hermes.pyth.network/v2/updates/price/latest`).
//   2. If the asset uses an inverted feed (e.g. JPYC → USD/JPY), invert.
//   3. On any failure, fall back to a deterministic mock price labeled
//      "indicative" in the UI.

import { PYTH_PRICE_IDS, PYTH_INVERTED } from '../config/priceFeeds';

const HERMES_URL =
    (import.meta as any).env?.VITE_PYTH_HERMES_URL || 'https://hermes.pyth.network';
const PYTH_DISABLED =
    String((import.meta as any).env?.VITE_DISABLE_PYTH || '').toLowerCase() === 'true';

/// Deterministic fallback prices. Values approximate live spot at the time
/// of writing; they only matter when Hermes is unreachable.
const MOCK_PRICES: Record<string, number> = {
    USDC: 1.0,
    EURC: 1.08,           // EUR/USD ≈ 1.08
    JPYC: 1 / 150,        // USD/JPY ≈ 150 → 1 JPY ≈ 0.00667 USD

    GOLD: 4500.0,
    AAPL: 220.0,
    MSTR: 1700.0,

    BTC: 95_000.0,
    ETH: 3_300.0,

    // Legacy aliases that still appear in older mock data.
    USDT: 1.0,
    USDe: 1.0,
    USDO: 1.0,
};

export function getMockPrice(symbol: string): number {
    return MOCK_PRICES[symbol] ?? 1.0;
}

/// Pull a single asset price from Hermes. Returns the inverted value when
/// `PYTH_INVERTED[symbol]` is true. Falls back to mock on any error.
export async function fetchPythPrice(symbol: string): Promise<number> {
    if (PYTH_DISABLED) return getMockPrice(symbol);

    const priceId = (PYTH_PRICE_IDS as Record<string, string>)[symbol];
    if (!priceId) return getMockPrice(symbol);

    try {
        const response = await fetch(
            `${HERMES_URL}/v2/updates/price/latest?ids[]=${priceId}`
        );
        if (!response.ok) throw new Error(`Pyth ${response.status}`);

        const data = await response.json();
        if (!data.parsed || data.parsed.length === 0) throw new Error('Pyth: empty');

        const priceData = data.parsed[0].price;
        const raw = Number(priceData.price) * Math.pow(10, priceData.expo);
        if (!isFinite(raw) || raw <= 0) throw new Error('Pyth: bad price');

        return PYTH_INVERTED[symbol] ? 1 / raw : raw;
    } catch (error) {
        console.warn(`[priceOracle] Falling back to mock for ${symbol}:`, error);
        return getMockPrice(symbol);
    }
}

export async function fetchAssetPrice(symbol: string): Promise<number> {
    return fetchPythPrice(symbol);
}

/// Batch helper used by Markets/Portfolio tabs.
export async function fetchAssetPrices(symbols: string[]): Promise<Record<string, number>> {
    const results = await Promise.all(
        symbols.map(async (sym) => [sym, await fetchAssetPrice(sym)] as const)
    );
    return Object.fromEntries(results);
}
