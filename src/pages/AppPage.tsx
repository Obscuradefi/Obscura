import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract } from 'wagmi';
import { useSearchParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AppTabs, { TabId } from '../components/AppTabs';
import Footer from '../components/Footer';
import SwapTab from '../features/swap/SwapTab';
import StakeTab from '../features/stake/StakeTab';
import PortfolioTab from '../features/portfolio/PortfolioTab';
import MarketsTab from '../features/markets/MarketsTab';
import LiquidityTab from '../features/liquidity/LiquidityTab';
import SwapAgent from '../features/swap/SwapAgent';
import ShieldTab from '../features/shield/ShieldTab';
import { addActivity } from '../lib/fluxMock';
import { useLiveActivitySync } from '../hooks/useLiveActivitySync';
import { ERC20_ABI } from '../config/dexConfig';
import { MOCK_TOKENS } from '../config/arc';

const VALID_TABS: TabId[] = ['shield', 'swap', 'stake', 'portfolio', 'markets', 'liquidity', 'bridge'];

// Mock-token symbols that expose a public mint() faucet on Arc Testnet.
// USDC is funded from https://faucet.circle.com (real Circle faucet) so it is
// not part of this list.
const FAUCET_TOKENS: Array<keyof typeof MOCK_TOKENS> = ['USDT', 'USDe', 'GOLD', 'AAPL', 'MSTR'];

const AppPage: React.FC = () => {
  useLiveActivitySync();

  const [searchParams] = useSearchParams();
  const initialTab = VALID_TABS.includes(searchParams.get('tab') as TabId)
    ? (searchParams.get('tab') as TabId)
    : 'portfolio';

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'shield': return <ShieldTab />;
      case 'swap': return <SwapTab />;
      case 'stake': return <StakeTab />;
      case 'portfolio': return <PortfolioTab onNavigate={handleTabChange} />;
      case 'markets': return <MarketsTab onSwapClick={() => handleTabChange('swap')} />;
      case 'liquidity': return <LiquidityTab />;
      default: return null;
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>

      <div className="site-wrapper" style={{ position: 'relative', zIndex: 1 }}>
        <AppHeader />

        <div style={{ paddingTop: 80, minHeight: '100vh' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 0' }}>
            <AppTabs activeTab={activeTab} onTabChange={handleTabChange} />

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
            >
              {renderTabContent()}
            </motion.div>
          </div>

          <Footer />
        </div>
      </div>

      <SwapAgent />
    </div>
  );
};

export default AppPage;
