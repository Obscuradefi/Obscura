# obscura

Privacy-first DeFi protocol with AI-powered trading, hybrid AMM+RFQ routing, encrypted vaults, and dark pool liquidity. Built on Base Sepolia testnet.

## Tech Stack

- React 18 + TypeScript + Vite 5
- React Router DOM v7
- Wagmi v2 + Viem v2 + RainbowKit v2
- Framer Motion v11
- TanStack React Query v5
- Tailwind CSS v3
- Lucide React

## Setup

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Environment

Network: **Base Sepolia** (Chain ID: 84532)

WalletConnect Project ID is set in `src/wagmi.js`. Replace with your own from [cloud.walletconnect.com](https://cloud.walletconnect.com) if needed.

## Project Structure

```
src/
  components/     Navbar, AppHeader, AppTabs, Hero, etc.
  features/       swap, shield, liquidity, portfolio, stake
  hooks/          useAMMQuote, usePriceFeed, useTokenBalance, etc.
  lib/            priceOracle, rfqMock, parseSwapIntent, pythClient
  data/           docsContent, mockMarkets, fluxAssets
  config/         dexConfig, priceFeeds, shieldConfig
  pages/          Landing, AppPage, DocsPage
  styles/         global.css

contracts/
  SimpleAMM.sol           AMM contract (deployed)
  RialoPrivacyPool.sol    Shield/Unshield contract (deployed)
  DEPLOYMENT.md           Contract addresses and deployment guide

public/
  assets/                 Background images
```

## Deployed Contracts (Base Sepolia)

| Contract | Address |
|---|---|
| SimpleAMM | `0x944b6cB6d8621603B4a094955123dbD96e289bA2` |
| RialoPrivacyPool | `0xA7e722Bb7b1FFeb14fbcd64e747B714C10eC5a45` |
| USDO | `0x191798C747807ae164f2a28fA5DFb5145AcE4b6B` |
| USDT | `0xdf273C73aE8a405d200e87b869b1C53013e5f64b` |
| USDe | `0xCAfb242bE67dc84419750da1C69d6792907d602f` |
| GOLD | `0xcC4c135f274AEEc398B0ED10EbE5a29a359eE88a` |
| AAPL | `0x8cc4eeda6cFCE3EB253DA45e843330dDDfdF738A` |
| MSTR | `0x8Ed9dE6A498d5889fFb9aB0920aBDB5Fbe9f7719` |

## Deploy

```bash
npm run build
```

Output goes to `dist/`. Deploy to Vercel or Netlify (configs already included).
