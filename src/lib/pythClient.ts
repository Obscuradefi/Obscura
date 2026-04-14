
const HERMES_URL = 'https://hermes.pyth.network'; 

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

export async function getPythPriceUpdate(priceIds: string[]): Promise<string[]> {
    try {
        
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

        
        const updates = data.binary.data.map(hexData => `0x${hexData}`);

        console.log('[Pyth] Successfully fetched', updates.length, 'price updates');

        return updates;
    } catch (error) {
        console.error('[Pyth] Failed to fetch price updates:', error);
        throw new Error(`Failed to fetch Pyth price update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export function getPythUpdateFee(updateCount: number): bigint {
    
    
    
    const feePerUpdate = BigInt('1000000000000000'); 
    return BigInt(updateCount) * feePerUpdate;
}
