import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import { http } from 'wagmi';

// Arc Testnet — https://docs.arc.io/arc/references/connect-to-arc
// USDC is the native gas token (18 decimals at the protocol level; the
// ERC-20 interface on the Arc-bound USDC contract is 6 decimals).
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    // Arc denominates gas in USDC at 18-decimal precision; wallets that don't
    // support custom gas tokens still display this as 18 dec while the ERC-20
    // interface (`0x36...`) uses 6 dec for app-level transfers.
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
});

const RPC_URL =
  import.meta.env.VITE_ARC_RPC_URL || 'https://rpc.testnet.arc.network';

// Resolve WalletConnect projectId: env first, then a clearly-broken sentinel.
// We deliberately do NOT bake a real project ID into the bundle so a
// misconfigured deploy fails loudly with a "wallet didn't open" instead of
// silently reusing somebody else's project metadata.
const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!PROJECT_ID) {
  // Surface the misconfiguration in the dev console without breaking SSR/build.
  // The dapp will still boot, but WalletConnect-based wallets will not work
  // until a real ID is supplied via the env var.
  // eslint-disable-next-line no-console
  console.warn(
    '[obscura] VITE_WALLETCONNECT_PROJECT_ID is not set. ' +
      'WalletConnect-based wallets will not be able to pair until you ' +
      'create a project at https://cloud.reown.com and set the env var.'
  );
}

export const config = getDefaultConfig({
  appName: 'Obscura',
  projectId: PROJECT_ID || 'OBSCURA_LOCAL_DEV_NO_PROJECT_ID',
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(RPC_URL),
  },
  ssr: false,
});
