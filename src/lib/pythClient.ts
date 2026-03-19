/**
 * Pyth Network Client
 * Fetches price update data from Pyth Hermes API for on-chain oracle updates
 */

const HERMES_URL = 'https://hermes.pyth.network'; // Pyth Hermes API endpoint

export interface PythPriceUpdate {
    binary: {
        encoding: string;
        data: string[];
    };
    parsed: Array<{
        id: string;
        price: {
            price: string;
            conf: string;
            expo: number;
            publish_time: number;
        };
    }>;
}

/**
 * Fetch price update data from Pyth Hermes API
 * @param priceIds Array of Pyth price feed IDs (hex format with 0x prefix)
 * @returns Encoded price update data ready for contract consumption
 */
export async function getPythPriceUpdate(priceIds: string[]): Promise<string[]> {
    try {
        // Build query string with price IDs
        const queryParams = priceIds.map(id => `ids[]=${id}`).join('&');
        const url = `${HERMES_URL}/v2/updates/price/latest?${queryParams}`;

        console.log('[Pyth] Fetching price updates for:', priceIds);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Pyth API error: ${response.status} ${response.statusText}`);
        }

        const data: PythPriceUpdate = await response.json();

        if (!data.binary || !data.binary.data || data.binary.data.length === 0) {
            throw new Error('No price update data received from Pyth');
        }

        // Return hex-encoded price update blobs
        const updates = data.binary.data.map(hexData => `0x${hexData}`);

        console.log('[Pyth] Successfully fetched', updates.length, 'price updates');

        return updates;
    } catch (error) {
        console.error('[Pyth] Failed to fetch price updates:', error);
        throw new Error(`Failed to fetch Pyth price update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get update fee for Pyth price updates
 * Base Sepolia Pyth typically requires 1 wei per update
 * We add buffer for safety
 * @param updateCount Number of price feeds being updated
 * @returns Fee in wei as bigint
 */
export function getPythUpdateFee(updateCount: number): bigint {
    // TEMPORARY: Use large fee to ensure transaction succeeds
    // Base Sepolia Pyth requires variable fees - using 0.001 ETH buffer
    // After success, we can optimize this
    const feePerUpdate = BigInt('1000000000000000'); // 0.001 ETH per update
    return BigInt(updateCount) * feePerUpdate;
}
