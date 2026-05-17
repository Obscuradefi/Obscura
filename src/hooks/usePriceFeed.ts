import { useState, useEffect } from 'react';
import { fetchAssetPrice } from '../lib/priceOracle';

export function usePriceFeed(symbol: string) {
    const [price, setPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            try {
                setLoading(true);
                const p = await fetchAssetPrice(symbol);
                if (isMounted) {
                    setPrice(p);
                    setError(null);
                }
            } catch (err: any) {
                if (isMounted) setError(err?.message ?? 'price fetch failed');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        run();
        const interval = setInterval(run, 60000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [symbol]);

    return { price, loading, error };
}

export function useMultiplePriceFeeds(symbols: string[]) {
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const run = async () => {
            try {
                setLoading(true);
                const results = await Promise.all(
                    symbols.map(async (sym) => {
                        try {
                            const p = await fetchAssetPrice(sym);
                            return { sym, p };
                        } catch {
                            return { sym, p: null };
                        }
                    })
                );
                if (isMounted) {
                    const map: Record<string, number> = {};
                    results.forEach(({ sym, p }) => {
                        if (p !== null) map[sym] = p;
                    });
                    setPrices(map);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        run();
        const interval = setInterval(run, 60000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbols.join(',')]);

    return { prices, loading };
}
