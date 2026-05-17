// FLUX assets — Arc Testnet edition.
//
// Quote token: USDC (native gas + ERC-20 interface).
// Stables: USDC + EURC (real Arc-issued) + JPYC (mock with inverted Pyth feed).
// Markets: GOLD, AAPL, MSTR (mock equities/commodity).

import {
  ARC_USDC_ADDRESS,
  ARC_USDC_DECIMALS,
  ARC_EURC_ADDRESS,
  ARC_EURC_DECIMALS,
  MOCK_TOKENS,
} from '../config/arc';

export interface FluxAsset {
  symbol: string;
  name: string;
  decimals: number;
  contractAddress: string;
  /** True once an on-chain address (other than the zero address) is set. */
  deployed: boolean;
  /** USDC: gas token + AMM quote. */
  isQuote?: boolean;
  /** Stable currencies (USDC, EURC, JPYC) — eligible for FxEscrow narrative. */
  isStable?: boolean;
  /** Pyth price feed needs inversion (e.g. JPYC -> USD/JPY). */
  inverted?: boolean;
  icon?: string;
}

const ZERO = '0x0000000000000000000000000000000000000000';

function asset(
  symbol: string,
  name: string,
  decimals: number,
  contractAddress: string,
  opts: Partial<FluxAsset> = {}
): FluxAsset {
  return {
    symbol,
    name,
    decimals,
    contractAddress,
    deployed: contractAddress !== ZERO,
    ...opts,
  };
}

export const FLUX_ASSETS: FluxAsset[] = [
  asset('USDC', 'USD Coin (Arc Native)', ARC_USDC_DECIMALS, ARC_USDC_ADDRESS, {
    isQuote: true,
    isStable: true,
  }),
  asset('EURC', 'Euro Coin (Arc Native)', ARC_EURC_DECIMALS, ARC_EURC_ADDRESS, {
    isStable: true,
  }),
  asset('JPYC', MOCK_TOKENS.JPYC.name, MOCK_TOKENS.JPYC.decimals, MOCK_TOKENS.JPYC.address, {
    isStable: true,
    inverted: true,
  }),
  asset('GOLD', MOCK_TOKENS.GOLD.name, MOCK_TOKENS.GOLD.decimals, MOCK_TOKENS.GOLD.address),
  asset('AAPL', MOCK_TOKENS.AAPL.name, MOCK_TOKENS.AAPL.decimals, MOCK_TOKENS.AAPL.address),
  asset('MSTR', MOCK_TOKENS.MSTR.name, MOCK_TOKENS.MSTR.decimals, MOCK_TOKENS.MSTR.address),
];

export function isPairAllowed(fromSymbol: string, toSymbol: string): boolean {
  if (fromSymbol === toSymbol) return false;
  const validSymbols = FLUX_ASSETS.map((a) => a.symbol);
  return validSymbols.includes(fromSymbol) && validSymbols.includes(toSymbol);
}

export function getAllowedPairsFor(symbol: string): string[] {
  return FLUX_ASSETS.filter((a) => a.symbol !== symbol).map((a) => a.symbol);
}

export function getAsset(symbol: string): FluxAsset | undefined {
  return FLUX_ASSETS.find((a) => a.symbol === symbol);
}

/** Convenience: USDC is the quote token everywhere on Arc. */
export const QUOTE_ASSET = FLUX_ASSETS[0];

/** True if both legs of the pair are stables (USDC/EURC/JPYC). FxEscrow eligible. */
export function isStablePair(fromSymbol: string, toSymbol: string): boolean {
  const a = getAsset(fromSymbol);
  const b = getAsset(toSymbol);
  return !!a?.isStable && !!b?.isStable;
}
