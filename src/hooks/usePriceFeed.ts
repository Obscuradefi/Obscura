import { useState, useEffect } from 'react';
import { fetchAssetPrice } from '../lib/priceOracle';
import { ASSET_PRICE_SOURCE } from '../config/priceFeeds';

/**
 * Hook to fetch real-time price feeds for assets
 * @param symbol Asset symbol (AAPL, MSTR, USDT, GOLD, etc.)
 * @returns price, loading state, and error
 */
export function usePriceFeed(symbol: string) {
    const [price, setPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        let interval: NodeJS.Timeout;

        const fetchPrice = async () => {
            try {
                setLoading(true);

                const source = ASSET_PRICE_SOURCE[symbol];
                if (!source) {
                    throw new Error(`No price source configured for ${symbol}`);
                }

                const newPrice = await fetchAssetPrice(symbol, source);

                if (isMounted) {
                    setPrice(newPrice);
                    setError(null);
                }
            } catch (err: any) {
                console.error(`Failed to fetch price for ${symbol}:`, err);
                if (isMounted) {
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        // Initial fetch
        fetchPrice();

        // Refresh every 60 seconds
        interval = setInterval(fetchPrice, 60000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [symbol]);

    return { price, loading, error };
}

/**
 * Hook to fetch multiple prices at once
 * @param symbols Array of asset symbols
 * @returns Map of symbol to price data
 */
export function useMultiplePriceFeeds(symbols: string[]) {
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let interval: NodeJS.Timeout;

        const fetchAllPrices = async () => {
            try {
                setLoading(true);

                const pricePromises = symbols.map(async (symbol) => {
                    const source = ASSET_PRICE_SOURCE[symbol];
                    if (!source) return { symbol, price: null };

                    try {
                        const price = await fetchAssetPrice(symbol, source);
                        return { symbol, price };
                    } catch {
                        return { symbol, price: null };
                    }
                });

                const results = await Promise.all(pricePromises);

                if (isMounted) {
                    const priceMap: Record<string, number> = {};
                    results.forEach(({ symbol, price }) => {
                        if (price !== null) priceMap[symbol] = price;
                    });
                    setPrices(priceMap);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchAllPrices();
        interval = setInterval(fetchAllPrices, 60000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [symbols.join(',')]);

    return { prices, loading };
}
