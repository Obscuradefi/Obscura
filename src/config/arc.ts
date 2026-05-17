// Single import surface for Arc Testnet addresses.
//
// Resolves at build time:
//   1. Prefer `contracts.generated.ts` (auto-emitted by deploy.cjs).
//   2. Fall back to `contracts.ts` if no deployment has happened yet.
//
// Vite tree-shakes the unused branch.

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - generated module may not exist yet on a fresh checkout
import * as generated from './contracts.generated';
import * as fallback from './contracts';

const src: typeof fallback =
  generated && (generated as typeof fallback).OBSCURA_AMM_ADDRESS &&
  (generated as typeof fallback).OBSCURA_AMM_ADDRESS !== '0x0000000000000000000000000000000000000000'
    ? (generated as typeof fallback)
    : fallback;

export const ARC_TESTNET_CHAIN_ID = src.ARC_TESTNET_CHAIN_ID;
export const ARC_USDC_ADDRESS = src.ARC_USDC_ADDRESS;
export const ARC_USDC_DECIMALS = src.ARC_USDC_DECIMALS;
export const ARC_EURC_ADDRESS = src.ARC_EURC_ADDRESS;
export const ARC_EURC_DECIMALS = src.ARC_EURC_DECIMALS;
export const ARC_EURC_PRICE_ID = src.ARC_EURC_PRICE_ID;
export const PYTH_CONTRACT_ADDRESS = src.PYTH_CONTRACT_ADDRESS;
export const OBSCURA_AMM_ADDRESS = src.OBSCURA_AMM_ADDRESS;
export const OBSCURA_SHIELD_ADDRESS = src.OBSCURA_SHIELD_ADDRESS;
export const OBSCURA_RFQ_ADDRESS = src.OBSCURA_RFQ_ADDRESS;
export const OBSCURA_NANOPAY_ADDRESS = src.OBSCURA_NANOPAY_ADDRESS;
export const RFQ_MAKER_ADDRESS = src.RFQ_MAKER_ADDRESS;
export const RFQ_EXTRA_MAKERS = src.RFQ_EXTRA_MAKERS;
export const MOCK_TOKENS = src.MOCK_TOKENS;
export type MockTokenSymbol = keyof typeof src.MOCK_TOKENS;

export const ARC_EXPLORER_URL = 'https://testnet.arcscan.app';

// Circle's StableFX FxEscrow on Arc Testnet — referenced for the "Compatible
// institutional bridge" badge in the UI. Obscura does not interact with it
// from the contracts; the maker network behind FxEscrow is permissioned.
// Source: https://docs.arc.io/arc/references/contract-addresses
export const STABLEFX_ESCROW_ADDRESS =
  '0x867650F5eAe8df91445971f14d89fd84F0C9a9f8' as `0x${string}`;

export function arcTxUrl(hash: string): string {
  return `${ARC_EXPLORER_URL}/tx/${hash}`;
}

export function arcAddressUrl(addr: string): string {
  return `${ARC_EXPLORER_URL}/address/${addr}`;
}

/** True once the AMM has been deployed and `contracts.generated.ts` is present. */
export const IS_DEPLOYED =
  OBSCURA_AMM_ADDRESS !== '0x0000000000000000000000000000000000000000' &&
  OBSCURA_SHIELD_ADDRESS !== '0x0000000000000000000000000000000000000000';

export const IS_RFQ_DEPLOYED =
  OBSCURA_RFQ_ADDRESS !== '0x0000000000000000000000000000000000000000' &&
  RFQ_MAKER_ADDRESS !== '0x0000000000000000000000000000000000000000';
