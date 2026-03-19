// Parse natural language intents: swap, shield, unshield, portfolio
// Strategy: Try local regex FIRST (free), fallback to Jatevo API (cheap)

import { FLUX_ASSETS } from '../data/fluxAssets';

export interface SwapIntent {
    amount: number;
    from: string;
    to: string;
}

export interface ShieldIntent {
    action: 'shield' | 'unshield';
    token: string;
    amount: number;
}

export interface ParseResult {
    success: boolean;
    type: 'swap' | 'shield' | 'portfolio';
    intent?: SwapIntent;
    shieldIntent?: ShieldIntent;
    error?: string;
    source: 'regex' | 'ai';
}

const VALID_TOKENS = FLUX_ASSETS.map(a => a.symbol.toUpperCase());

// Token aliases for more flexible matching
const TOKEN_ALIASES: Record<string, string> = {
    'USDC': 'USDO',
    'USD': 'USDO',
    'DOLLAR': 'USDO',
    'TETHER': 'USDT',
    'APPLE': 'AAPL',
    'MICROSTRATEGY': 'MSTR',
    'EMAS': 'GOLD',
    'ETHENA': 'USDe',
};

function resolveToken(raw: string): string | null {
    const upper = raw.toUpperCase();
    if (VALID_TOKENS.includes(upper)) return upper;
    if (TOKEN_ALIASES[upper]) return TOKEN_ALIASES[upper];
    // Handle case-sensitive USDe
    if (upper === 'USDE') return 'USDe';
    return null;
}

/**
 * Try to parse portfolio check
 */
function parsePortfolio(message: string): ParseResult | null {
    const portfolioPatterns = [
        /(?:cek|check|lihat|show|view|tampilkan|display)\s*(?:portfolio|portofolio|saldo|balance|aset|asset|wallet)/i,
        /(?:portfolio|portofolio|saldo|balance|my\s*(?:tokens|assets|balance))/i,
        /(?:berapa|how\s*much|what'?s?\s*my)\s*(?:saldo|balance|aset|tokens)/i,
    ];

    for (const pattern of portfolioPatterns) {
        if (pattern.test(message)) {
            return { success: true, type: 'portfolio', source: 'regex' };
        }
    }
    return null;
}

/**
 * Try to parse shield/unshield intent
 */
function parseShieldUnshield(message: string): ParseResult | null {
    const shieldPatterns = [
        /(?:shield|lindungi|protect|sembunyikan|hide)\s+([\d.]+)\s+(\w+)/i,
        /(?:unshield|buka|reveal|tampilkan|unhide)\s+([\d.]+)\s+(\w+)/i,
    ];

    for (const pattern of shieldPatterns) {
        const match = message.match(pattern);
        if (match) {
            const amount = parseFloat(match[1]);
            const token = resolveToken(match[2]);
            const isUnshield = /(?:unshield|buka|reveal|tampilkan|unhide)/i.test(message);

            if (!isNaN(amount) && amount > 0 && token) {
                return {
                    success: true,
                    type: 'shield',
                    shieldIntent: { action: isUnshield ? 'unshield' : 'shield', token, amount },
                    source: 'regex',
                };
            }
        }
    }
    return null;
}

/**
 * Step 1: Try to parse swap with regex (no API cost)
 */
export function parseWithRegex(message: string): ParseResult {
    // Check portfolio first
    const portfolioResult = parsePortfolio(message);
    if (portfolioResult) return portfolioResult;

    // Check shield/unshield
    const shieldResult = parseShieldUnshield(message);
    if (shieldResult) return shieldResult;

    // Swap patterns
    const patterns = [
        /(?:swap|tukar|convert|exchange|beli|buy|jual|sell)\s+([\d.]+)\s+(\w+)\s+(?:to|ke|into|for|→|->|jadi)\s+(\w+)/i,
        /([\d.]+)\s+(\w+)\s+(?:to|ke|→|->)\s+(\w+)/i,
    ];

    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
            const amount = parseFloat(match[1]);
            const from = resolveToken(match[2]);
            const to = resolveToken(match[3]);

            if (!isNaN(amount) && amount > 0 && from && to && from !== to) {
                return {
                    success: true,
                    type: 'swap',
                    intent: { amount, from, to },
                    source: 'regex'
                };
            }
        }
    }

    return { success: false, type: 'swap', error: 'Could not parse with regex', source: 'regex' };
}

/**
 * Step 2: Fallback to Jatevo AI API (costs credits, but cheap with glm-4.7)
 */
export async function parseWithAI(message: string): Promise<ParseResult> {
    const apiKey = import.meta.env.VITE_JATEVO_API_KEY;
    if (!apiKey) {
        return { success: false, type: 'swap', error: 'No API key configured', source: 'ai' };
    }

    try {
        const response = await fetch('https://jatevo.id/api/open/v1/inference/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'glm-4.7',
                messages: [
                    {
                        role: 'system',
                        content: `Extract user intent from message. Return JSON only.
For swaps: {"type":"swap","amount":number,"from":"TOKEN","to":"TOKEN"}
For shield: {"type":"shield","action":"shield"|"unshield","token":"TOKEN","amount":number}
For portfolio: {"type":"portfolio"}
If cannot parse: {"error":"cannot parse"}
Valid tokens: ${VALID_TOKENS.join(', ')}.`
                    },
                    { role: 'user', content: message }
                ],
                temperature: 0,
                max_tokens: 100
            })
        });

        if (!response.ok) {
            throw new Error(`API Error ${response.status}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content || '';

        const jsonMatch = content.match(/\{[^}]+\}/);
        if (!jsonMatch) throw new Error('No JSON in response');

        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.error) {
            return { success: false, type: 'swap', error: parsed.error, source: 'ai' };
        }

        if (parsed.type === 'portfolio') {
            return { success: true, type: 'portfolio', source: 'ai' };
        }

        if (parsed.type === 'shield' && parsed.action && parsed.token && parsed.amount > 0) {
            const token = resolveToken(parsed.token);
            if (token) {
                return {
                    success: true,
                    type: 'shield',
                    shieldIntent: { action: parsed.action, token, amount: parsed.amount },
                    source: 'ai',
                };
            }
        }

        if (parsed.type === 'swap' || (parsed.amount && parsed.from && parsed.to)) {
            const from = resolveToken(parsed.from);
            const to = resolveToken(parsed.to);

            if (parsed.amount > 0 && from && to && from !== to) {
                return {
                    success: true,
                    type: 'swap',
                    intent: { amount: parsed.amount, from, to },
                    source: 'ai'
                };
            }
        }

        return { success: false, type: 'swap', error: 'Invalid parsed values', source: 'ai' };
    } catch (err: any) {
        return { success: false, type: 'swap', error: err.message || 'API call failed', source: 'ai' };
    }
}

/**
 * Main parser: regex first, then AI fallback
 */
export async function parseSwapIntent(message: string): Promise<ParseResult> {
    // Step 1: Try regex (free)
    const regexResult = parseWithRegex(message);
    if (regexResult.success) return regexResult;

    // Step 2: Fallback to AI (cheap)
    return parseWithAI(message);
}
