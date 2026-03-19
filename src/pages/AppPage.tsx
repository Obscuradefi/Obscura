import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
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
import BackgroundGrid from '../components/BackgroundGrid';
import { addActivity } from '../lib/fluxMock';

const RIALO_USDC_ADDRESS = '0x191798C747807ae164f2a28fA5DFb5145AcE4b6B';
const MINT_ABI = [
  { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

const AppPage = () => {
    const [activeTab, setActiveTab] = useState<TabId>('portfolio');
    const { address, isConnected } = useAccount();
    const { writeContract } = useWriteContract();

    const handleFaucetClick = () => {
        if (!isConnected || !address) {
            alert("Please connect your wallet first.");
            return;
        }
        try {
            writeContract({ 
                address: RIALO_USDC_ADDRESS, 
                abi: MINT_ABI, 
                functionName: 'mint', 
                args: [address, parseUnits('100', 18)] 
            }, {
                onSuccess: () => {
                    addActivity({ type: 'faucet', description: 'Minted 100 USDO from faucet' });
                },
                onError: (e) => {
                    console.error("Faucet minting failed", e);
                }
            });
        } catch (err: any) {
            console.error(err);
        }
    };

    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'shield':
                return <ShieldTab />;
            case 'swap':
                return <SwapTab />;
            case 'stake':
                return <StakeTab />;
            case 'portfolio':
                return <PortfolioTab onNavigate={handleTabChange} />;
            case 'markets':
                return <MarketsTab onSwapClick={() => handleTabChange('swap')} />;
            case 'liquidity':
                return <LiquidityTab />;
            default:
                return null;
        }
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh' }}>
            <BackgroundGrid />

            <div style={{ position: 'relative', zIndex: 10 }}>
                <AppHeader onFaucetClick={handleFaucetClick} />

                <div style={{
                    paddingTop: '120px',
                    minHeight: '100vh',
                }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
                        <AppTabs activeTab={activeTab} onTabChange={handleTabChange} />

                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderTabContent()}
                        </motion.div>
                    </div>
                    
                    <Footer />
                </div>
            </div>

            {/* AI Swap Agent - floating overlay */}
            <SwapAgent />
        </div>
    );
};

export default AppPage;