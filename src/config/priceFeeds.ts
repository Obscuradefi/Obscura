

export const PYTH_PRICE_IDS = {
    
    'USDT': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
    'USDC': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
    'DAI': '0xb0948a5e5313200c632b51bb5ca32f6de0d36e9950a942d19751e833f70dabfd',
    'USDe': '0x6ec879b1e9963de5ee97e9c8710b742d6228252a5e2ca12d4ae81d7fe5ee8c5d',
    'USDO': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a', 

    
    'AAPL': '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688',
    'MSTR': '0xe1e80251e5f5184f2195008382538e847fafc36f751896889dd3d1b1f6111f09', 

    
    'GOLD': '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2', 

    
    'BTC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
} as const;

export const ASSET_PRICE_SOURCE = {
    'AAPL': 'pyth',
    'MSTR': 'pyth',
    'USDT': 'pyth',
    'USDe': 'pyth',
    'USDO': 'pyth',
    'GOLD': 'pyth',
} as const;

export const MASSIVE_SYMBOL_MAP = {
    'AAPL': 'AAPL',
    'MSTR': 'MSTR',
} as const;
