import React, { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { addActivity, getActivityHistory, type SwapActivity } from '../../lib/fluxMock';
import { FLUX_ASSETS } from '../../data/fluxAssets';
import { useTokenBalance } from '../../hooks/useTokenBalance';
import { TabId } from '../../components/AppTabs';

const RIALO_USDC_ADDRESS = '0x191798C747807ae164f2a28fA5DFb5145AcE4b6B';

const MINT_ABI = [
  { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }
];

import { SHIELD_CONTRACT_ADDRESS, SHIELD_ABI } from '../../config/shieldConfig';

const PortfolioTab = ({ onNavigate }: { onNavigate?: (tab: TabId) => void }) => {
    const { address, isConnected } = useAccount();
    const [activities, setActivities] = useState<SwapActivity[]>([]);
    const [showEncrypted, setShowEncrypted] = useState(false);

    // Read Public Balance (USDO)
    const { data: balanceData, refetch: refetchPublic } = useReadContract({
        address: RIALO_USDC_ADDRESS,
        abi: MINT_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
        query: { enabled: isConnected && !!address }
    });

    // Read Private Balance (cUSDO) from Shield Contract
    const { data: encryptedBalanceData, refetch: refetchPrivate } = useReadContract({
        address: SHIELD_CONTRACT_ADDRESS,
        abi: SHIELD_ABI,
        functionName: 'getEncryptedBalance',
        args: [address as `0x${string}`, RIALO_USDC_ADDRESS],
        query: { enabled: isConnected && !!address }
    });

    const encryptedBalanceVal = encryptedBalanceData ? parseFloat(formatUnits(encryptedBalanceData as bigint, 18)) : 0;
    const formattedBalance = balanceData ? formatUnits(balanceData as bigint, 18) : '0';
    
    const { writeContract, data: hash } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        setActivities(getActivityHistory());
        const interval = setInterval(() => {
            setActivities(getActivityHistory());
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    if (isConfirmed) {
        refetchPublic();
        refetchPrivate();
    }

    const handleMint = () => {
        writeContract({ address: RIALO_USDC_ADDRESS, abi: MINT_ABI, functionName: 'mint', args: [address, parseUnits('100', 18)] });
        addActivity({ type: 'faucet', description: 'Minted 100 USDO from faucet' });
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'swap': return '🔄';
            case 'shield': return '🛡️';
            case 'unshield': return '🔓';
            case 'faucet': return '💧';
            default: return '📝';
        }
    };

    if (!isConnected) {
        return (
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '50px 20px', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="cyber-card"
                    style={{ padding: '60px', textAlign: 'center', maxWidth: '600px', width: '100%', border: '1px dashed var(--text-dim)' }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔒</div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '15px', color: 'white' }}>ACCESS RESTRICTED</h2>
                    <p style={{ marginBottom: '30px', color: 'var(--text-dim)', fontSize: '1.1rem' }}>
                        CONNECT YOUR WALLET TO VIEW YOUR PORTFOLIO.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <ConnectButton label="CONNECT TO BASE SEPOLIA" />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 60px', display: 'flex', flexDirection: 'column', gap: '30px' }}
        >
            <h2 className="glow-text" style={{ fontSize: '2.5rem', marginBottom: '5px' }}>
                PORTFOLIO
            </h2>

            {/* Portfolio Overview (Hero Section) */}
            <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <h2 style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', fontFamily: 'Inter' }}>Total Balance</h2>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px' }}>
                        <h1 className="mono" style={{ fontSize: '4.5rem', margin: 0, lineHeight: 1, color: 'var(--text-main)', textShadow: '0 0 30px rgba(0, 229, 255, 0.2)' }}>
                            ${(parseFloat(formattedBalance) + encryptedBalanceVal).toFixed(2)}
                        </h1>
                        <div className="badge-green" style={{ marginBottom: '10px' }}>+5.24% (7d)</div>
                    </div>
                </div>
                
                {/* SVG Sparkline */}
                <div className="sparkline-container" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '140px', zIndex: 1, pointerEvents: 'none', opacity: 0.8 }}>
                    <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1000 100">
                        <defs>
                            <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--neon-cyan)" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="var(--neon-cyan)" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path className="sparkline-area" d="M0,100 L0,80 Q50,70 100,50 T300,60 T500,30 T700,50 Q850,20 1000,10 L1000,100 Z" />
                        <path className="sparkline-path" d="M0,80 Q50,70 100,50 T300,60 T500,30 T700,50 Q850,20 1000,10" />
                    </svg>
                </div>
            </div>

            {/* Quick Actions Panel */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                <div onClick={() => onNavigate?.('swap')} className="cyber-card" style={{ padding: '24px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.1)', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.5rem', boxShadow: 'inset 0 0 15px rgba(0,229,255,0.2)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
                    </div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Swap</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>Exchange tokens instantly</p>
                </div>
                <div onClick={() => onNavigate?.('stake')} className="cyber-card" style={{ padding: '24px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(157, 78, 221, 0.1)', color: 'var(--neon-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.5rem', boxShadow: 'inset 0 0 15px rgba(157, 78, 221,0.2)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Stake</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>Earn yield on privacy assets</p>
                </div>
                <div onClick={() => onNavigate?.('bridge')} className="cyber-card" style={{ padding: '24px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(0, 255, 102, 0.1)', color: 'var(--neon-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.5rem', boxShadow: 'inset 0 0 15px rgba(0, 255, 102,0.2)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                    </div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Bridge</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>Transfer across networks</p>
                </div>
            </div>

            {/* Asset Table */}
            <div className="glass-panel" style={{ padding: '30px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <h3 style={{ fontSize: '1.4rem', margin: 0 }}>Your Assets</h3>
                    <button onClick={handleMint} disabled={isConfirming} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                        {isConfirming ? 'Minting...' : '+ Faucet USDO'}
                    </button>
                </div>

                <div style={{ width: '100%', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-dim)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <th style={{ padding: '16px 20px', fontWeight: 500 }}>Asset</th>
                                <th style={{ padding: '16px 20px', fontWeight: 500 }}>Balance</th>
                                <th style={{ padding: '16px 20px', fontWeight: 500 }}>Value (USD)</th>
                                <th style={{ padding: '16px 20px', fontWeight: 500, textAlign: 'right' }}>24h Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            {FLUX_ASSETS.map((asset) => (
                                <AssetRow
                                    key={asset.symbol}
                                    asset={asset}
                                    userAddress={address}
                                />
                            ))}

                            {/* cUSDO Row */}
                            <tr style={{ transition: 'background 0.2s' }}>
                                <td style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '42px', height: '42px', background: 'var(--neon-purple)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: 'white' }}>🔒</div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--neon-purple)' }}>cUSDO</div>
                                            <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Obscura Privacy Layer</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="mono" style={{ padding: '20px', fontSize: '1.1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {showEncrypted ? encryptedBalanceVal.toFixed(2) : '••••••'}
                                        <button onClick={() => setShowEncrypted(!showEncrypted)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '1rem', padding: '4px' }}>
                                            {showEncrypted ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                            )}
                                        </button>
                                    </div>
                                </td>
                                <td className="mono" style={{ padding: '20px', fontSize: '1.1rem' }}>
                                    ${showEncrypted ? encryptedBalanceVal.toFixed(2) : '••••••'}
                                </td>
                                <td style={{ padding: '20px', textAlign: 'right' }}>
                                    <span className="badge-green">+0.05%</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Activity History */}
            <div style={{ marginTop: '10px' }}>
                <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '20px', fontSize: '1.3rem' }}>
                    ACTIVITY HISTORY
                </h3>

                {activities.length === 0 ? (
                    <div className="cyber-card" style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '15px', opacity: 0.5 }}>📋</div>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                            No activity yet. Start trading to see your history.
                        </p>
                    </div>
                ) : (
                    <div className="cyber-card" style={{ padding: '30px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {activities.map(activity => (
                                <div
                                    key={activity.id}
                                    style={{
                                        padding: '15px',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ fontSize: '1.5rem' }}>
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.9rem', marginBottom: '3px' }}>
                                                {activity.description}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono' }}>
                                                {formatTimestamp(activity.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '0.7rem',
                                        padding: '4px 10px',
                                        background: 'rgba(0, 240, 255, 0.1)',
                                        color: 'var(--neon-cyan)',
                                        borderRadius: '8px',
                                        textTransform: 'uppercase',
                                    }}>
                                        {activity.type}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Component for individual token row
function AssetRow({ asset, userAddress }: { asset: typeof FLUX_ASSETS[0], userAddress: string | undefined }) {
    const { formattedBalance } = useTokenBalance(
        asset.deployed ? asset.contractAddress : undefined,
        userAddress
    );

    const balance = asset.deployed ? formattedBalance : (asset.mockBalance || 0);
    const isReal = asset.deployed;
    
    // Fallback Icon colors
    const colors = ['#2775CA', '#26A17B', '#8E8E93', '#FFC107', '#000000', '#F2A900'];
    const colorIndex = asset.symbol.charCodeAt(0) % colors.length;

    return (
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
            <td style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ 
                        width: '42px', 
                        height: '42px', 
                        background: colors[colorIndex], 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: 'bold', 
                        fontSize: '1.2rem', 
                        color: 'white' 
                    }}>
                        {asset.symbol.charAt(0)}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{asset.symbol}</div>
                            {!isReal && (
                                <span style={{
                                    fontSize: '0.6rem',
                                    padding: '2px 6px',
                                    background: 'rgba(138, 43, 226, 0.2)',
                                    color: 'var(--neon-purple)',
                                    borderRadius: '6px',
                                }}>
                                    DEMO
                                </span>
                            )}
                        </div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{asset.name}</div>
                    </div>
                </div>
            </td>
            <td className="mono" style={{ padding: '20px', fontSize: '1.1rem' }}>
                {balance.toFixed(4)}
            </td>
            <td className="mono" style={{ padding: '20px', fontSize: '1.1rem', color: isReal ? 'white' : 'var(--text-dim)' }}>
                ${(balance * (asset.symbol === 'USDO' || asset.symbol === 'USDT' || asset.symbol === 'USDe' ? 1 : 1.5)).toFixed(2)}
            </td>
            <td style={{ padding: '20px', textAlign: 'right' }}>
                <span className="badge-green">+0.00%</span>
            </td>
        </tr>
    );
};

export default PortfolioTab;
