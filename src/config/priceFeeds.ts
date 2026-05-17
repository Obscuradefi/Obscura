// Pyth Network price feed IDs.
// Source: https://docs.pyth.network/price-feeds/core/price-feeds
//
// USDC is the AMM quote token and is fixed at $1 inside ObscuraAMM, so it
// does not need a Pyth feed for pricing. We still keep the entry so display
// code (charts, markets tab) can quote USDC if asked.
//
// EURC: priced via EUR/USD feed.
// JPYC: Pyth only publishes USD/JPY (yen-per-dollar). The contract handles
//       inversion via the `inverted` flag on AssetInfo; for the front-end's
//       Hermes display path we apply the inversion ourselves in priceOracle.ts.

export const PYTH_PRICE_IDS = {
    // Stable + FX
    'USDC':    '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a', // USDC/USD
    'EURC':    '0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b', // EUR/USD
    'JPYC':    '0xef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52', // USD/JPY (inverted!)

    // Equities and commodities (Pyth Stable feeds).
    'AAPL':    '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688',
    'MSTR':    '0xe1e80251e5f5184f2195008382538e847fafc36f751896889dd3d1b1f6111f09',
    'GOLD':    '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2', // XAU/USD

    // Crypto display feeds (markets tab).
    'BTC':     '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    'ETH':     '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
} as const;

/// Set to `true` for symbols where the Pyth feed is "wrong way round" and we
/// need to invert at display time. Keep this in sync with the per-asset
/// `inverted` flag set by `scripts/deploy.cjs` (`MOCK_TOKENS[].inverted`).
export const PYTH_INVERTED: Record<string, boolean> = {
    JPYC: true,
};

export const ASSET_PRICE_SOURCE = {
    'USDC': 'pyth',
    'EURC': 'pyth',
    'JPYC': 'pyth',
    'AAPL': 'pyth',
    'MSTR': 'pyth',
    'GOLD': 'pyth',
} as const;
