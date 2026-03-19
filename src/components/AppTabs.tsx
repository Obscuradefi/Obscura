import React from 'react';

export type TabId = 'shield' | 'swap' | 'stake' | 'portfolio' | 'markets' | 'liquidity' | 'bridge';

interface AppTabsProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

const AppTabs: React.FC<AppTabsProps> = ({ activeTab, onTabChange }) => {
    const tabs: { id: TabId; label: string; disabled?: boolean }[] = [
        { id: 'shield', label: 'SHIELD' }, // Changed from OBSCURA
        { id: 'swap', label: 'SWAP' },
        { id: 'stake', label: 'STAKE', disabled: true },
        { id: 'portfolio', label: 'PORTFOLIO' },
        { id: 'markets', label: 'MARKETS' },
        { id: 'liquidity', label: 'LIQUIDITY' },
        { id: 'bridge', label: 'BRIDGE', disabled: true },
    ];

    return (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => !tab.disabled && onTabChange(tab.id)}
                    style={{
                        background: activeTab === tab.id 
                            ? 'rgba(0, 240, 255, 0.1)' 
                            : 'transparent',
                        border: `1px solid ${activeTab === tab.id ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
                        color: activeTab === tab.id ? 'var(--neon-cyan)' : 'var(--text-dim)',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: tab.disabled ? 'not-allowed' : 'pointer',
                        fontFamily: 'JetBrains Mono',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease',
                        opacity: tab.disabled ? 0.5 : 1,
                        position: 'relative',
                        textTransform: 'uppercase'
                    }}
                >
                    {tab.label}
                    {tab.disabled && (
                        <span style={{ 
                            fontSize: '0.6rem', 
                            marginLeft: '5px', 
                            color: 'var(--neon-purple)',
                            verticalAlign: 'super' 
                        }}>
                            SOON
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};

export default AppTabs;