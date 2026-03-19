import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { FLUX_ASSETS } from '../../data/fluxAssets';
import { SIMPLE_AMM_ADDRESS, SIMPLE_AMM_ABI, ERC20_ABI } from '../../config/dexConfig';
import { useMultiplePriceFeeds } from '../../hooks/usePriceFeed';
import { addActivity } from '../../lib/fluxMock';

interface PoolCardProps {
    asset: typeof FLUX_ASSETS[0];
    reserve: number;
    tvl: number;
    userShares: number;
    address: string | undefined;
}

const PoolCard: React.FC<PoolCardProps> = ({ asset, reserve, tvl, userShares, address }) => {
    const [mode, setMode] = useState<'idle' | 'add' | 'remove'>('idle');
    const [amount, setAmount] = useState('');

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    // Read user token balance for MAX button
    const { data: tokenBalance } = useReadContract({
        address: asset.contractAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
        query: { enabled: !!address && !!asset.contractAddress }
    });

    const formattedTokenBalance = tokenBalance ? Number(formatUnits(tokenBalance as bigint, 18)) : 0;

    // Read current allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: asset.contractAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, SIMPLE_AMM_ADDRESS],
        query: { enabled: !!address && !!asset.contractAddress }
    });

    const needsApproval = () => {
        if (!amount || !allowance) return true;
        try {
            return (allowance as bigint) < parseUnits(amount, 18);
        } catch { return true; }
    };

    const handleApprove = () => {
        if (!amount || !asset.contractAddress) return;
        writeContract({
            address: asset.contractAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [SIMPLE_AMM_ADDRESS, parseUnits(amount, 18)]
        });
    };

    const handleAddLiquidity = () => {
        if (!amount || !asset.contractAddress) return;
        writeContract({
            address: SIMPLE_AMM_ADDRESS,
            abi: SIMPLE_AMM_ABI,
            functionName: 'addLiquidity',
            args: [asset.contractAddress as `0x${string}`, parseUnits(amount, 18)]
        }, {
            onSuccess: () => {
                addActivity({ type: 'liquidity', description: `Added ${amount} ${asset.symbol} liquidity` });
                setAmount('');
                setMode('idle');
            }
        });
    };

    const handleRemoveLiquidity = () => {
        if (!amount || !asset.contractAddress) return;
        writeContract({
            address: SIMPLE_AMM_ADDRESS,
            abi: SIMPLE_AMM_ABI,
            functionName: 'removeLiquidity',
            args: [asset.contractAddress as `0x${string}`, parseUnits(amount, 18)]
        }, {
            onSuccess: () => {
                addActivity({ type: 'liquidity', description: `Removed ${amount} ${asset.symbol} LP shares` });
                setAmount('');
                setMode('idle');
            }
        });
    };

    const isProcessing = isPending || isConfirming;

    // Mock APY based on reserve size
    const mockAPY = reserve > 0 ? (5 + Math.random() * 15).toFixed(1) : '0.0';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="cyber-card"
            style={{ padding: '25px' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{asset.symbol}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{asset.name}</div>
                </div>
                <div style={{
                    background: 'rgba(0, 255, 136, 0.1)',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    color: '#00FF88',
                    fontFamily: 'JetBrains Mono'
                }}>
                    {mockAPY}% APY
                </div>
            </div>

            {/* Stats */}
            <div style={{ background: 'rgba(0, 240, 255, 0.05)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>POOL RESERVES</span>
                    <span style={{ fontSize: '0.9rem', fontFamily: 'JetBrains Mono' }}>
                        {reserve.toLocaleString(undefined, { maximumFractionDigits: 2 })} {asset.symbol}
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>TVL</span>
                    <span style={{ fontSize: '0.9rem', fontFamily: 'JetBrains Mono', color: 'var(--neon-cyan)' }}>
                        ${tvl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            {/* User Shares */}
            {address && userShares > 0 && (
                <div style={{
                    background: 'rgba(0, 255, 136, 0.05)',
                    border: '1px solid rgba(0, 255, 136, 0.2)',
                    padding: '10px',
                    borderRadius: '6px',
                    marginBottom: '15px',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <span style={{ fontSize: '0.75rem', color: '#00FF88' }}>YOUR LP SHARES</span>
                    <span style={{ fontSize: '0.9rem', fontFamily: 'JetBrains Mono', color: '#00FF88' }}>
                        {userShares.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </span>
                </div>
            )}

            {/* Action Panel */}
            {mode === 'idle' ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="btn-primary"
                        style={{ flex: 1, fontSize: '0.85rem', padding: '10px' }}
                        onClick={() => setMode('add')}
                        disabled={!address}
                    >
                        + ADD
                    </button>
                    <button
                        className="btn-secondary"
                        style={{ flex: 1, fontSize: '0.85rem', padding: '10px', background: 'rgba(138,43,226,0.1)', border: '1px solid var(--neon-purple)', color: 'var(--neon-purple)' }}
                        onClick={() => setMode('remove')}
                        disabled={!address || userShares === 0}
                    >
                        - REMOVE
                    </button>
                </div>
            ) : (
                <div>
                    <div style={{ marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                            type="number"
                            className="cyber-input"
                            placeholder={mode === 'add' ? 'Amount to add' : 'Shares to remove'}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{ flex: 1, marginBottom: 0, fontSize: '0.9rem' }}
                        />
                        <button
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--neon-cyan)',
                                color: 'var(--neon-cyan)',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontFamily: 'JetBrains Mono'
                            }}
                            onClick={() => setAmount(
                                mode === 'add'
                                    ? formattedTokenBalance.toString()
                                    : userShares.toString()
                            )}
                        >
                            MAX
                        </button>
                    </div>

                    {mode === 'add' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {needsApproval() ? (
                                <button
                                    className="btn-primary"
                                    style={{ flex: 1, fontSize: '0.8rem', padding: '10px', background: 'rgba(0,240,255,0.1)', border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)' }}
                                    onClick={handleApprove}
                                    disabled={!amount || isProcessing}
                                >
                                    {isProcessing ? 'APPROVING...' : '1. APPROVE'}
                                </button>
                            ) : null}
                            <button
                                className="btn-primary"
                                style={{ flex: 1, fontSize: '0.8rem', padding: '10px' }}
                                onClick={handleAddLiquidity}
                                disabled={!amount || isProcessing || needsApproval()}
                            >
                                {isProcessing ? 'ADDING...' : needsApproval() ? '2. ADD' : 'ADD LIQUIDITY'}
                            </button>
                        </div>
                    ) : (
                        <button
                            className="btn-primary"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '10px', background: 'rgba(138,43,226,0.2)', border: '1px solid var(--neon-purple)', color: 'var(--neon-purple)' }}
                            onClick={handleRemoveLiquidity}
                            disabled={!amount || isProcessing}
                        >
                            {isProcessing ? 'REMOVING...' : 'REMOVE LIQUIDITY'}
                        </button>
                    )}

                    <button
                        style={{
                            width: '100%',
                            marginTop: '8px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-dim)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            padding: '6px'
                        }}
                        onClick={() => { setMode('idle'); setAmount(''); }}
                    >
                        CANCEL
                    </button>
                </div>
            )}

            {/* Tx Hash */}
            {hash && (
                <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '0.75rem' }}>
                    <a href={`https://sepolia.basescan.org/tx/${hash}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--neon-cyan)' }}>
                        {isConfirmed ? '✅ Confirmed' : '⏳ Pending'} — View Tx
                    </a>
                </div>
            )}
        </motion.div>
    );
};

const LiquidityTab: React.FC = () => {
    const { address } = useAccount();

    const reserveContracts = FLUX_ASSETS
        .filter(a => a.deployed)
        .map(asset => ({
            address: SIMPLE_AMM_ADDRESS,
            abi: SIMPLE_AMM_ABI,
            functionName: 'reserves',
            args: [asset.contractAddress]
        }));

    const { data: reservesData } = useReadContracts({ contracts: reserveContracts as any });

    const sharesContracts = address ? FLUX_ASSETS
        .filter(a => a.deployed)
        .map(asset => ({
            address: SIMPLE_AMM_ADDRESS,
            abi: SIMPLE_AMM_ABI,
            functionName: 'liquidityShares',
            args: [address, asset.contractAddress]
        })) : [];

    const { data: sharesData } = useReadContracts({ contracts: sharesContracts as any });

    const deployedSymbols = FLUX_ASSETS.filter(a => a.deployed).map(a => a.symbol);
    const { prices } = useMultiplePriceFeeds(deployedSymbols);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 className="glow-text" style={{ fontSize: '2.5rem', marginBottom: '15px' }}>
                LIQUIDITY POOLS
            </h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '40px', fontFamily: 'JetBrains Mono', fontSize: '0.9rem' }}>
                // PROVIDE LIQUIDITY & EARN TRADING FEES
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                {FLUX_ASSETS.filter(a => a.deployed).map((asset, index) => {
                    const reserve = reservesData?.[index]?.result as bigint | undefined;
                    const reserveFormatted = reserve ? Number(formatUnits(reserve, 18)) : 0;
                    const price = prices[asset.symbol] || 0;
                    const tvl = reserveFormatted * price;
                    const userSharesBN = sharesData?.[index]?.result as bigint | undefined;
                    const userSharesFormatted = userSharesBN ? Number(formatUnits(userSharesBN, 18)) : 0;

                    return (
                        <PoolCard
                            key={asset.symbol}
                            asset={asset}
                            reserve={reserveFormatted}
                            tvl={tvl}
                            userShares={userSharesFormatted}
                            address={address}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default LiquidityTab;
