

export type RoutingType = 'AMM' | 'Hybrid' | 'RFQ' | 'Custom RFQ';

export interface SwapQuote {
    id: string;
    maker?: string;
    inputAmount: number;
    outputAmount: number;
    rate: number;
    fee: number;
    feePercent: number;
    expirySeconds: number;
    routing: RoutingType;
}

export interface SwapActivity {
    id: string;
    timestamp: number;
    type: 'swap' | 'shield' | 'unshield' | 'faucet';
    description: string;
    fromAsset?: string;
    toAsset?: string;
    amount?: number;
}

export function determineRouting(usdAmount: number): RoutingType {
    if (usdAmount >= 10_000_000) return 'Custom RFQ';
    if (usdAmount >= 100_000) return 'RFQ';
    if (usdAmount >= 10_000) return 'Hybrid';
    return 'AMM';
}

export function getFeePercent(routing: RoutingType): number {
    switch (routing) {
        case 'AMM': return 0.01;
        case 'Hybrid': return 0.02;
        case 'RFQ': return 0.03 + Math.random() * 0.02; 
        case 'Custom RFQ': return 0.05;
        default: return 0.01;
    }
}

export function generateQuotes(
    fromAsset: string,
    toAsset: string,
    inputAmount: number,
    fromPrice: number,
    toPrice: number
): SwapQuote[] {
    const usdAmount = inputAmount * fromPrice;
    const routing = determineRouting(usdAmount);
    const quotes: SwapQuote[] = [];

    if (routing === 'AMM' || routing === 'Hybrid') {
        
        const feePercent = getFeePercent(routing);
        const outputBeforeFee = (inputAmount * fromPrice) / toPrice;
        const fee = outputBeforeFee * feePercent;
        const outputAmount = outputBeforeFee - fee;

        quotes.push({
            id: `quote-${Date.now()}`,
            inputAmount,
            outputAmount,
            rate: outputAmount / inputAmount,
            fee,
            feePercent,
            expirySeconds: routing === 'Hybrid' ? 30 : 60,
            routing,
        });
    } else if (routing === 'RFQ') {
        
        const makers = ['Wintermute', 'Flow Traders', 'Galaxy Digital'];

        for (let i = 0; i < 3; i++) {
            const feePercent = 0.03 + (i * 0.01); 
            const outputBeforeFee = (inputAmount * fromPrice) / toPrice;
            const fee = outputBeforeFee * feePercent;
            const outputAmount = outputBeforeFee - fee;

            quotes.push({
                id: `quote-rfq-${Date.now()}-${i}`,
                maker: makers[i],
                inputAmount,
                outputAmount,
                rate: outputAmount / inputAmount,
                fee,
                feePercent,
                expirySeconds: 15,
                routing,
            });
        }
    }

    return quotes;
}

const HISTORY_KEY = 'obscuraActivityHistory';

export function getActivityHistory(): SwapActivity[] {
    try {
        const data = localStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function addActivity(activity: Omit<SwapActivity, 'id' | 'timestamp'>): void {
    const history = getActivityHistory();
    const newActivity: SwapActivity = {
        ...activity,
        id: `activity-${Date.now()}`,
        timestamp: Date.now(),
    };
    history.unshift(newActivity); 

    
    if (history.length > 100) {
        history.splice(100);
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearActivityHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
}

export function mockExecuteSwap(
    fromAsset: string,
    toAsset: string,
    inputAmount: number,
    outputAmount: number,
    quote: SwapQuote
): Promise<{ success: boolean; txHash: string }> {
    return new Promise((resolve) => {
        setTimeout(() => {
            
            addActivity({
                type: 'swap',
                description: `Swap ${inputAmount.toFixed(4)} ${fromAsset} → ${outputAmount.toFixed(4)} ${toAsset}`,
                fromAsset,
                toAsset,
                amount: inputAmount,
            });

            resolve({
                success: true,
                txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
            });
        }, 1500); 
    });
}
