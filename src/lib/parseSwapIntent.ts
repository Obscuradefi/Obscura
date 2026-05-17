// Intent parser for Obscura's AI Trading Agent.
//
// Supports four intent families:
//   1. swap        — "swap 5 USDC to GOLD"
//   2. shield      — "shield 10 USDC at high privacy"
//   3. unshield    — "unshield 5 USDC"
//   4. portfolio   — "cek portfolio"
//   5. conditional — "buy GOLD with 50 USDC if price drops 5%"
//                    "shield 100 USDC at high privacy when AAPL > 250"
//
// Strategy: regex first (deterministic + free), then optionally fall back to
// a Jatevo-hosted LLM for natural-language flexibility.

import { FLUX_ASSETS } from '../data/fluxAssets';
import { PrivacyLevel } from '../config/shieldConfig';

export interface SwapIntent {
    amount: number;
    from: string;
    to: string;
}

export interface ShieldIntent {
    action: 'shield' | 'unshield';
    token: string;
    amount: number;
    level?: PrivacyLevel;
}

/** A condition that must hold before an action executes. */
export interface PriceCondition {
    /** Asset whose price the condition watches. */
    asset: string;
    op: 'gt' | 'lt' | 'pct_drop' | 'pct_rise';
    /** Absolute price for gt/lt, or percent (5 = 5%) for pct_*. */
    value: number;
}

export interface ConditionalIntent {
    condition: PriceCondition;
    /** Action to perform when the condition triggers. */
    action:
        | { kind: 'swap'; intent: SwapIntent }
        | { kind: 'shield'; intent: ShieldIntent };
}

export type ParseResult =
    | { success: true; type: 'swap'; intent: SwapIntent; source: 'regex' | 'ai' }
    | { success: true; type: 'shield'; shieldIntent: ShieldIntent; source: 'regex' | 'ai' }
    | { success: true; type: 'portfolio'; source: 'regex' | 'ai' }
    | { success: true; type: 'conditional'; conditional: ConditionalIntent; source: 'regex' | 'ai' }
    | { success: false; type: 'swap'; error: string; source: 'regex' | 'ai' };

const VALID_TOKENS = FLUX_ASSETS.map((a) => a.symbol.toUpperCase());

const TOKEN_ALIASES: Record<string, string> = {
    USDO: 'USDC',
    USD: 'USDC',
    DOLLAR: 'USDC',
    TETHER: 'USDT',
    APPLE: 'AAPL',
    MICROSTRATEGY: 'MSTR',
    EMAS: 'GOLD',
    ETHENA: 'USDe',
};

function resolveToken(raw: string): string | null {
    if (!raw) return null;
    const upper = raw.toUpperCase();
    if (VALID_TOKENS.includes(upper)) {
        // Preserve canonical casing (USDe, not USDE).
        return FLUX_ASSETS.find((a) => a.symbol.toUpperCase() === upper)?.symbol ?? upper;
    }
    if (TOKEN_ALIASES[upper]) return TOKEN_ALIASES[upper];
    if (upper === 'USDE') return 'USDe';
    return null;
}

function resolvePrivacyLevel(raw: string | undefined | null): PrivacyLevel | undefined {
    if (!raw) return undefined;
    const v = raw.toLowerCase();
    if (v.startsWith('low')) return PrivacyLevel.LOW;
    if (v.startsWith('med')) return PrivacyLevel.MEDIUM;
    if (v.startsWith('high') || v.startsWith('max')) return PrivacyLevel.HIGH;
    return undefined;
}

function parsePortfolio(message: string): ParseResult | null {
    const portfolioPatterns = [
        /(?:cek|check|lihat|show|view|tampilkan|display)\s*(?:portfolio|portofolio|saldo|balance|aset|asset|wallet)/i,
        /(?:portfolio|portofolio|saldo|balance|my\s*(?:tokens|assets|balance))/i,
        /(?:berapa|how\s*much|what'?s?\s*my)\s*(?:saldo|balance|aset|tokens)/i,
    ];
    for (const pattern of portfolioPatterns) {
        if (pattern.test(message)) return { success: true, type: 'portfolio', source: 'regex' };
    }
    return null;
}

function parseShieldUnshield(message: string): ParseResult | null {
    // shield/unshield <amount> <token> [at|with|level] <low|medium|high>
    const re = /(?:^|\s)(shield|lindungi|protect|sembunyikan|hide|unshield|buka|reveal|tampilkan|unhide)\s+([\d.]+)\s+(\w+)(?:\s+(?:at|with|level|tingkat|privacy)\s*(low|medium|high|med|max))?/i;
    const match = message.match(re);
    if (!match) return null;

    const verb = match[1].toLowerCase();
    const isUnshield = /(unshield|buka|reveal|tampilkan|unhide)/.test(verb);
    const amount = parseFloat(match[2]);
    const token = resolveToken(match[3]);
    const level = resolvePrivacyLevel(match[4]);

    if (!isNaN(amount) && amount > 0 && token) {
        return {
            success: true,
            type: 'shield',
            shieldIntent: {
                action: isUnshield ? 'unshield' : 'shield',
                token,
                amount,
                level,
            },
            source: 'regex',
        };
    }
    return null;
}

function parseSwap(message: string): ParseResult | null {
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
                    source: 'regex',
                };
            }
        }
    }
    return null;
}

function parseCondition(message: string): PriceCondition | null {
    // "if GOLD drops 5%", "when AAPL > 250", "kalau MSTR turun 3%"
    const pctDrop = message.match(/(?:if|when|kalau|jika)\s+(\w+)\s+(?:drops?|falls?|turun|jatuh|down)\s+([\d.]+)\s*%/i);
    if (pctDrop) {
        const asset = resolveToken(pctDrop[1]);
        const v = parseFloat(pctDrop[2]);
        if (asset && !isNaN(v)) return { asset, op: 'pct_drop', value: v };
    }
    const pctRise = message.match(/(?:if|when|kalau|jika)\s+(\w+)\s+(?:rises?|pumps?|naik|up)\s+([\d.]+)\s*%/i);
    if (pctRise) {
        const asset = resolveToken(pctRise[1]);
        const v = parseFloat(pctRise[2]);
        if (asset && !isNaN(v)) return { asset, op: 'pct_rise', value: v };
    }
    const cmp = message.match(/(?:if|when|kalau|jika)\s+(\w+)\s*(>|<|>=|<=|above|below|over|under)\s*([\d.]+)/i);
    if (cmp) {
        const asset = resolveToken(cmp[1]);
        const op = cmp[2].toLowerCase();
        const v = parseFloat(cmp[3]);
        if (asset && !isNaN(v)) {
            const isGt = ['>', '>=', 'above', 'over'].includes(op);
            return { asset, op: isGt ? 'gt' : 'lt', value: v };
        }
    }
    return null;
}

export function parseWithRegex(message: string): ParseResult {
    const portfolio = parsePortfolio(message);
    if (portfolio) return portfolio;

    // Conditional? Strip the condition and parse the action half.
    const condition = parseCondition(message);
    if (condition) {
        const condIdx = message.search(/(?:if|when|kalau|jika)\s+\w+\s+/i);
        const actionPart = condIdx > 0 ? message.slice(0, condIdx).trim() : '';
        if (actionPart) {
            const swapAction = parseSwap(actionPart);
            if (swapAction && swapAction.success && swapAction.type === 'swap') {
                return {
                    success: true,
                    type: 'conditional',
                    conditional: {
                        condition,
                        action: { kind: 'swap', intent: swapAction.intent },
                    },
                    source: 'regex',
                };
            }
            const shieldAction = parseShieldUnshield(actionPart);
            if (shieldAction && shieldAction.success && shieldAction.type === 'shield') {
                return {
                    success: true,
                    type: 'conditional',
                    conditional: {
                        condition,
                        action: { kind: 'shield', intent: shieldAction.shieldIntent },
                    },
                    source: 'regex',
                };
            }
        }
    }

    const shieldResult = parseShieldUnshield(message);
    if (shieldResult) return shieldResult;

    const swapResult = parseSwap(message);
    if (swapResult) return swapResult;

    return { success: false, type: 'swap', error: 'Could not parse with regex', source: 'regex' };
}

export async function parseWithAI(message: string): Promise<ParseResult> {
    const env = (import.meta as any).env;
    const apiKey = env?.VITE_JATEVO_API_KEY;
    const baseUrl = env?.VITE_JATEVO_BASE_URL || 'https://jatevo.id/api/open/v1/inference';
    const model = env?.VITE_JATEVO_MODEL || 'glm-4.7';

    if (!apiKey) {
        return { success: false, type: 'swap', error: 'No API key configured', source: 'ai' };
    }

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: 'system',
                        content: `Extract user intent from message. Return JSON only.
For swaps: {"type":"swap","amount":number,"from":"TOKEN","to":"TOKEN"}
For shield: {"type":"shield","action":"shield"|"unshield","token":"TOKEN","amount":number,"level":"low"|"medium"|"high"}
For portfolio: {"type":"portfolio"}
If cannot parse: {"error":"cannot parse"}
Valid tokens: ${VALID_TOKENS.join(', ')}.`,
                    },
                    { role: 'user', content: message },
                ],
                temperature: 0,
                max_tokens: 100,
            }),
        });

        if (!response.ok) throw new Error(`API Error ${response.status}`);
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
            const level = resolvePrivacyLevel(parsed.level);
            if (token) {
                return {
                    success: true,
                    type: 'shield',
                    shieldIntent: { action: parsed.action, token, amount: parsed.amount, level },
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
                    source: 'ai',
                };
            }
        }
        return { success: false, type: 'swap', error: 'Invalid parsed values', source: 'ai' };
    } catch (err: any) {
        return { success: false, type: 'swap', error: err.message || 'API call failed', source: 'ai' };
    }
}

export async function parseSwapIntent(message: string): Promise<ParseResult> {
    const regexResult = parseWithRegex(message);
    if (regexResult.success) return regexResult;
    return parseWithAI(message);
}
