import React from 'react';
import { motion } from 'framer-motion';
import { FLUX_ASSETS } from '../../data/fluxAssets';
import { MOCK_MARKETS } from '../../data/mockMarkets';
import { useMultiplePriceFeeds } from '../../hooks/usePriceFeed';

interface MarketsTabProps {
    onSwapClick: (asset: string) => void;
}

const MarketsTab: React.FC<MarketsTabProps> = ({ onSwapClick }) => {
    // Fetch real prices for all assets
    const deployedSymbols = FLUX_ASSETS.filter(a => a.deployed).map(a => a.symbol);
    const { prices: realPrices, loading: pricesLoading } = useMultiplePriceFeeds(deployedSymbols);
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 className="glow-text" style={{ fontSize: '2.5rem', marginBottom: '15px' }}>
                MARKETS
            </h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '40px', fontFamily: 'JetBrains Mono', fontSize: '0.9rem' }}>
        // LIVE MARKET DATA
            </p>

            <div className="cyber-card" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0, 240, 255, 0.05)', borderBottom: '1px solid rgba(0, 240, 255, 0.2)' }}>
                            <th style={{ padding: '20px', textAlign: 'left', color: 'var(--neon-cyan)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>
                                ASSET
                            </th>
                            <th style={{ padding: '20px', textAlign: 'right', color: 'var(--neon-cyan)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>
                                PRICE
                            </th>
                            <th style={{ padding: '20px', textAlign: 'right', color: 'var(--neon-cyan)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>
                                24H CHANGE
                            </th>
                            <th style={{ padding: '20px', textAlign: 'right', color: 'var(--neon-cyan)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>
                                24H VOLUME
                            </th>
                            <th style={{ padding: '20px', textAlign: 'center', color: 'var(--neon-cyan)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>
                                ACTION
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {FLUX_ASSETS.map((asset, index) => {
                            const marketData = MOCK_MARKETS.find(m => m.symbol === asset.symbol);
                            const isPositive = (marketData?.change24h || 0) >= 0;

                            return (
                                <motion.tr
                                    key={asset.symbol}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    style={{
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                        transition: '0.3s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 240, 255, 0.03)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <td style={{ padding: '20px' }}>
                                        <div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '3px' }}>
                                                {asset.symbol}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                                {asset.name}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px', textAlign: 'right', fontFamily: 'JetBrains Mono', fontSize: '1.1rem' }}>
                                        {pricesLoading ? (
                                            <span style={{ color: 'var(--text-dim)' }}>...</span>
                                        ) : realPrices[asset.symbol] ? (
                                            <React.Fragment>
                                                ${realPrices[asset.symbol].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                <span style={{ fontSize: '0.7rem', color: '#00FF88', marginLeft: '6px' }}>●</span>
                                            </React.Fragment>
                                        ) : (
                                            <React.Fragment>${marketData?.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</React.Fragment>
                                        )}
                                    </td>
                                    <td style={{
                                        padding: '20px',
                                        textAlign: 'right',
                                        fontFamily: 'JetBrains Mono',
                                        fontSize: '1rem',
                                        color: isPositive ? '#00FF88' : '#FF4444',
                                    }}>
                                        {isPositive ? '+' : ''}{marketData?.change24h.toFixed(2)}%
                                    </td>
                                    <td style={{ padding: '20px', textAlign: 'right', fontFamily: 'JetBrains Mono', fontSize: '0.95rem', color: 'var(--text-dim)' }}>
                                        ${marketData?.volume24h.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td style={{ padding: '20px', textAlign: 'center' }}>
                                        <button
                                            className="btn-primary"
                                            onClick={() => onSwapClick(asset.symbol)}
                                            style={{
                                                fontSize: '0.8rem',
                                                padding: '8px 20px',
                                            }}
                                        >
                                            SWAP
                                        </button>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div style={{
                marginTop: '30px',
                padding: '20px',
                background: 'rgba(0, 240, 255, 0.03)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                borderRadius: '12px',
                fontSize: '0.85rem',
                color: 'var(--text-dim)',
                textAlign: 'center',
            }}>
                💡 Real-time prices are fetched from Massive API (stocks), Pyth Network (crypto), and GoldAPI (commodities). Green dot ● indicates live data.
            </div>
        </div>
    );
};

export default MarketsTab;
