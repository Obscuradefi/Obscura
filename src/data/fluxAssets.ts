

export interface FluxAsset {
  symbol: string;
  name: string;
  decimals: number;
  contractAddress?: string;  
  mockBalance?: number;       
  deployed: boolean;          
  icon?: string;
}

export const FLUX_ASSETS: FluxAsset[] = [
  {
    symbol: 'USDO',
    name: 'USDO',
    decimals: 18,
    contractAddress: '0x191798C747807ae164f2a28fA5DFb5145AcE4b6B',
    deployed: true,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 18,
    contractAddress: '0xdf273C73aE8a405d200e87b869b1C53013e5f64b',
    deployed: true,
  },
  {
    symbol: 'USDe',
    name: 'Ethena USDe',
    decimals: 18,
    contractAddress: '0xCAfb242bE67dc84419750da1C69d6792907d602f',
    deployed: true,
  },
  {
    symbol: 'GOLD',
    name: 'Gold Token',
    decimals: 18,
    contractAddress: '0xcC4c135f274AEEc398B0ED10EbE5a29a359eE88a',
    deployed: true,
  },
  {
    symbol: 'AAPL',
    name: 'Apple Stock Token',
    decimals: 18,
    contractAddress: '0x8cc4eeda6cFCE3EB253DA45e843330dDDfdF738A',
    deployed: true,
  },
  {
    symbol: 'MSTR',
    name: 'MicroStrategy Stock Token',
    decimals: 18,
    contractAddress: '0x8Ed9dE6A498d5889fFb9aB0920aBDB5Fbe9f7719',
    deployed: true,
  },
];

export function isPairAllowed(fromSymbol: string, toSymbol: string): boolean {
  if (fromSymbol === toSymbol) return false;
  const validSymbols = FLUX_ASSETS.map(a => a.symbol);
  return validSymbols.includes(fromSymbol) && validSymbols.includes(toSymbol);
}

export function getAllowedPairsFor(symbol: string): string[] {
  return FLUX_ASSETS.filter(a => a.symbol !== symbol).map(a => a.symbol);
}

export function getAsset(symbol: string): FluxAsset | undefined {
  return FLUX_ASSETS.find(a => a.symbol === symbol);
}
