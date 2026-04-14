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

    
    const { data: balanceData, refetch: refetchPublic } = useReadContract({
        address: RIALO_USDC_ADDRESS,
        abi: MINT_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
        query: { enabled: isConnected && !!address }
    });

    
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
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ background: 'rgba(13,13,18,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '56px 48px', textAlign: 'center', maxWidth: 480 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(61,158,78,0.08)', border: '1px solid rgba(61,158,78,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px', fontSize: '1.5rem' }}>🔒</div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#F0F0F0', marginBottom: 10 }}>Connect your wallet</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 26, fontSize: '0.88rem', lineHeight: 1.65 }}>Connect to Base Sepolia to view your portfolio.</p>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><ConnectButton label="Connect wallet" /></div>
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#F0F0F0', margin: '0 0 4px' }}>Portfolio</h2>
            </div>

            {}
            <div style={{ background: 'rgba(13,13,18,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '32px 36px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(61,158,78,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Total balance</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
                    <div style={{ fontSize: '3.2rem', fontWeight: 800, letterSpacing: '-0.05em', color: '#F0F0F0', lineHeight: 1 }}>
                        ${(parseFloat(formattedBalance) + encryptedBalanceVal).toFixed(2)}
                    </div>
                    <div className="badge-green" style={{ marginBottom: 8, fontSize: '0.72rem' }}>+5.24% (7d)</div>
                </div>
                <div style={{ marginTop: 18, height: 72, position: 'relative' }}>
                    <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1000 72">
                        <defs>
                            <linearGradient id="portfolio-grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d="M0,72 L0,58 Q100,48 200,38 T500,42 T700,22 Q900,10 1000,6 L1000,72 Z" fill="url(#portfolio-grad)" />
                        <path d="M0,58 Q100,48 200,38 T500,42 T700,22 Q900,10 1000,6" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px rgba(61,158,78,0.5))' }} />
                    </svg>
                </div>
            </div>

            {}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                    { tab: 'swap', label: 'Swap', desc: 'Exchange tokens instantly', color: 'var(--green-400)', bg: 'rgba(61,158,78,0.08)', border: 'rgba(61,158,78,0.18)' },
                    { tab: 'stake', label: 'Stake', desc: 'Earn yield on privacy assets', color: 'var(--neon-purple)', bg: 'rgba(157,78,221,0.08)', border: 'rgba(157,78,221,0.18)' },
                    { tab: 'bridge', label: 'Bridge', desc: 'Transfer across networks', color: 'var(--green-300)', bg: 'rgba(61,158,78,0.05)', border: 'rgba(61,158,78,0.12)' },
                ].map(item => (
                    <div key={item.tab} onClick={() => onNavigate?.(item.tab as any)}
                        style={{ background: 'rgba(13,13,18,0.85)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 14, padding: '22px 20px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.25s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = item.border; e.currentTarget.style.background = item.bg; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(13,13,18,0.85)'; }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', color: item.color, marginBottom: 6 }}>{item.label}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{item.desc}</div>
                    </div>
                ))}
            </div>

            {}
            <div style={{ background: 'rgba(13,13,18,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#F0F0F0', margin: 0 }}>Your assets</h3>
                    <button onClick={handleMint} disabled={isConfirming}
                        style={{ background: 'rgba(61,158,78,0.08)', border: '1px solid rgba(61,158,78,0.2)', color: 'var(--green-300)', padding: '7px 18px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.04em' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(61,158,78,0.18)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(61,158,78,0.08)'; }}>
                        {isConfirming ? 'Minting...' : 'Faucet USDO'}
                    </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {['Asset', 'Balance', 'Value (USD)', '24h'].map((h, i) => (
                                    <th key={h} style={{ padding: '12px 18px', fontWeight: 600, fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: i === 3 ? 'right' : 'left' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {FLUX_ASSETS.map((asset) => (
                                <AssetRow key={asset.symbol} asset={asset} userAddress={address} />
                            ))}
                            {}
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <td style={{ padding: '16px 18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 36, height: 36, background: 'rgba(157,78,221,0.15)', border: '1px solid rgba(157,78,221,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🔒</div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--neon-purple)' }}>cUSDO</div>
                                            <div style={{ color: 'var(--text-dim)', fontSize: '0.76rem' }}>Obscura Privacy Layer</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px 18px', fontSize: '0.95rem', fontWeight: 600, color: '#F0F0F0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {showEncrypted ? encryptedBalanceVal.toFixed(2) : '••••••'}
                                        <button onClick={() => setShowEncrypted(!showEncrypted)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 2, display: 'flex' }}>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{showEncrypted ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></> : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>}</svg>
                                        </button>
                                    </div>
                                </td>
                                <td style={{ padding: '16px 18px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>${showEncrypted ? encryptedBalanceVal.toFixed(2) : '••••••'}</td>
                                <td style={{ padding: '16px 18px', textAlign: 'right' }}><span className="badge-green">+0.05%</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {}
            <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--green-400)', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Activity history</h3>
                {activities.length === 0 ? (
                    <div style={{ background: 'rgba(13,13,18,0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '40px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: 12, opacity: 0.5 }}>📋</div>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>No activity yet. Start trading to see your history.</p>
                    </div>
                ) : (
                    <div style={{ background: 'rgba(13,13,18,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {activities.map(activity => (
                            <div key={activity.id} style={{ padding: '13px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ fontSize: '1.2rem' }}>{getActivityIcon(activity.type)}</div>
                                    <div>
                                        <div style={{ fontSize: '0.86rem', color: '#F0F0F0', marginBottom: 2 }}>{activity.description}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{formatTimestamp(activity.timestamp)}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.68rem', padding: '4px 10px', background: 'rgba(61,158,78,0.08)', color: 'var(--green-400)', borderRadius: 7, border: '1px solid rgba(61,158,78,0.15)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                                    {activity.type}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

function AssetRow({ asset, userAddress }: { asset: typeof FLUX_ASSETS[0], userAddress: string | undefined }) {
    const { formattedBalance } = useTokenBalance(
        asset.deployed ? asset.contractAddress : undefined,
        userAddress
    );
    const balance = asset.deployed ? formattedBalance : (asset.mockBalance || 0);
    const isReal = asset.deployed;
    const colors = ['#2775CA', '#26A17B', '#8E8E93', '#FFC107', '#000000', '#F2A900'];
    const colorIndex = asset.symbol.charCodeAt(0) % colors.length;

    return (
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <td style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, background: colors[colorIndex], borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: 'white', flexShrink: 0 }}>
                        {asset.symbol.charAt(0)}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F0F0F0' }}>{asset.symbol}</div>
                            {!isReal && <span style={{ fontSize: '0.58rem', padding: '2px 6px', background: 'rgba(157,78,221,0.15)', color: 'var(--neon-purple)', borderRadius: 5, fontWeight: 600 }}>DEMO</span>}
                        </div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.76rem' }}>{asset.name}</div>
                    </div>
                </div>
            </td>
            <td style={{ padding: '14px 18px', fontSize: '0.95rem', fontWeight: 600, color: '#F0F0F0' }}>{balance.toFixed(4)}</td>
            <td style={{ padding: '14px 18px', fontSize: '0.95rem', color: isReal ? '#F0F0F0' : 'var(--text-dim)' }}>
                ${(balance * (asset.symbol === 'USDO' || asset.symbol === 'USDT' || asset.symbol === 'USDe' ? 1 : 1.5)).toFixed(2)}
            </td>
            <td style={{ padding: '14px 18px', textAlign: 'right' }}><span className="badge-green">+0.00%</span></td>
        </tr>
    );
}

export default PortfolioTab;
