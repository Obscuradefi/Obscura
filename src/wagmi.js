import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';
import { http } from 'wagmi';

export const config = getDefaultConfig({
  appName: 'Obscura',
  projectId: 'da6302e79a03a3a6a94b7563ca418624',
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http('https://base-sepolia.g.alchemy.com/v2/pAuTzan6E4kmLvnrI5EUh'),
  },
  ssr: false,
});