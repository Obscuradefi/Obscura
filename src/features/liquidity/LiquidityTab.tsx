import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { FLUX_ASSETS } from '../../data/fluxAssets';
import { SIMPLE_AMM_ADDRESS, SIMPLE_AMM_ABI, ERC20_ABI } from '../../config/dexConfig';
import { useMultiplePriceFeeds } from '../../hooks/usePriceFeed';
import { addActivity } from '../../lib/fluxMock';

const G = {
  green: 'var(--green-300)',
  greenBg: 'rgba(61,158,78,0.08)',
  greenBorder: 'rgba(61,158,78,0.2)',
  dim: 'var(--text-dim)',
  secondary: 'var(--text-secondary)',
  card: { background: 'rgba(13,13,18,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 } as React.CSSProperties,
  input: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.09)', color: '#F0F0F0', padding: '12px 70px 12px 14px', borderRadius: 10, fontSize: '0.95rem', outline: 'none', width: '100%', fontFamily: 'Inter, system-ui, sans-serif', transition: 'border-color 0.2s' } as React.CSSProperties,
};

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

  const { data: tokenBalance } = useReadContract({
    address: asset.contractAddress as `0x${string}`,
    abi: ERC20_ABI, functionName: 'balanceOf',
    args: [address], query: { enabled: !!address && !!asset.contractAddress }
  });

  const { data: allowance } = useReadContract({
    address: asset.contractAddress as `0x${string}`,
    abi: ERC20_ABI, functionName: 'allowance',
    args: [address, SIMPLE_AMM_ADDRESS], query: { enabled: !!address && !!asset.contractAddress }
  });

  const formattedTokenBalance = tokenBalance ? Number(formatUnits(tokenBalance as bigint, 18)) : 0;

  const needsApproval = () => {
    if (!amount || !allowance) return true;
    try { return (allowance as bigint) < parseUnits(amount, 18); } catch { return true; }
  };

  const handleApprove = () => {
    if (!amount || !asset.contractAddress) return;
    writeContract({ address: asset.contractAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'approve', args: [SIMPLE_AMM_ADDRESS, parseUnits(amount, 18)] });
  };

  const handleAddLiquidity = () => {
    if (!amount || !asset.contractAddress) return;
    writeContract({ address: SIMPLE_AMM_ADDRESS, abi: SIMPLE_AMM_ABI, functionName: 'addLiquidity', args: [asset.contractAddress as `0x${string}`, parseUnits(amount, 18)] }, {
      onSuccess: () => { addActivity({ type: 'liquidity', description: `Added ${amount} ${asset.symbol} liquidity` }); setAmount(''); setMode('idle'); }
    });
  };

  const handleRemoveLiquidity = () => {
    if (!amount || !asset.contractAddress) return;
    writeContract({ address: SIMPLE_AMM_ADDRESS, abi: SIMPLE_AMM_ABI, functionName: 'removeLiquidity', args: [asset.contractAddress as `0x${string}`, parseUnits(amount, 18)] }, {
      onSuccess: () => { addActivity({ type: 'liquidity', description: `Removed ${amount} ${asset.symbol} LP shares` }); setAmount(''); setMode('idle'); }
    });
  };

  const isProcessing = isPending || isConfirming;
  const mockAPY = reserve > 0 ? (5 + Math.random() * 15).toFixed(1) : '0.0';

  const btnBase: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid', letterSpacing: '0.03em' };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={G.card}>
      {}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#F0F0F0' }}>{asset.symbol}</div>
          <div style={{ fontSize: '0.75rem', color: G.dim, marginTop: 2 }}>{asset.name}</div>
        </div>
        <div style={{ background: G.greenBg, border: `1px solid ${G.greenBorder}`, padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', color: G.green, fontWeight: 600 }}>
          {mockAPY}% APY
        </div>
      </div>

      {}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px 16px', borderRadius: 10, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: '0.7rem', color: G.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pool reserves</span>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#F0F0F0' }}>
            {reserve.toLocaleString(undefined, { maximumFractionDigits: 2 })} {asset.symbol}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.7rem', color: G.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>TVL</span>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: G.green }}>
            ${tvl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {}
      {address && userShares > 0 && (
        <div style={{ background: G.greenBg, border: `1px solid ${G.greenBorder}`, padding: '10px 14px', borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: G.green, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Your LP shares</span>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: G.green }}>
            {userShares.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </span>
        </div>
      )}

      {}
      {mode === 'idle' ? (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{ ...btnBase, flex: 1, background: G.greenBg, borderColor: G.greenBorder, color: G.green }}
            onClick={() => setMode('add')} disabled={!address}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(61,158,78,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = G.greenBg; }}
          >Add</button>
          <button
            style={{ ...btnBase, flex: 1, background: 'rgba(157,78,221,0.08)', borderColor: 'rgba(157,78,221,0.25)', color: 'var(--neon-purple)' }}
            onClick={() => setMode('remove')} disabled={!address || userShares === 0}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(157,78,221,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(157,78,221,0.08)'; }}
          >Remove</button>
        </div>
      ) : (
        <div>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input type="number" placeholder={mode === 'add' ? 'Amount to add' : 'Shares to remove'}
              value={amount} onChange={e => setAmount(e.target.value)} style={G.input}
              onFocus={e => (e.target.style.borderColor = 'var(--green-600)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')} />
            <button
              onClick={() => setAmount(mode === 'add' ? formattedTokenBalance.toString() : userShares.toString())}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: G.greenBg, border: `1px solid ${G.greenBorder}`, color: G.green, padding: '4px 10px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}>
              MAX
            </button>
          </div>

          {mode === 'add' ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {needsApproval() && (
                <button style={{ ...btnBase, flex: 1, background: G.greenBg, borderColor: G.greenBorder, color: G.green }}
                  onClick={handleApprove} disabled={!amount || isProcessing}>
                  {isProcessing ? 'Approving...' : '1. Approve'}
                </button>
              )}
              <button style={{ ...btnBase, flex: 1, background: G.greenBg, borderColor: G.greenBorder, color: G.green }}
                onClick={handleAddLiquidity} disabled={!amount || isProcessing || needsApproval()}>
                {isProcessing ? 'Adding...' : needsApproval() ? '2. Add' : 'Add liquidity'}
              </button>
            </div>
          ) : (
            <button style={{ ...btnBase, width: '100%', background: 'rgba(157,78,221,0.1)', borderColor: 'rgba(157,78,221,0.3)', color: 'var(--neon-purple)' }}
              onClick={handleRemoveLiquidity} disabled={!amount || isProcessing}>
              {isProcessing ? 'Removing...' : 'Remove liquidity'}
            </button>
          )}
          <button
            style={{ width: '100%', marginTop: 8, background: 'transparent', border: 'none', color: G.dim, cursor: 'pointer', fontSize: '0.75rem', padding: '6px' }}
            onClick={() => { setMode('idle'); setAmount(''); }}>
            Cancel
          </button>
        </div>
      )}

      {hash && (
        <div style={{ marginTop: 12, textAlign: 'center', fontSize: '0.74rem' }}>
          <a href={`https://sepolia.basescan.org/tx/${hash}`} target="_blank" rel="noopener noreferrer" style={{ color: G.green }}>
            {isConfirmed ? 'Confirmed' : 'Pending'} — View transaction
          </a>
        </div>
      )}
    </motion.div>
  );
};

const LiquidityTab: React.FC = () => {
  const { address } = useAccount();
  const deployedAssets = FLUX_ASSETS.filter(a => a.deployed);

  const reserveContracts = deployedAssets.map(asset => ({
    address: SIMPLE_AMM_ADDRESS, abi: SIMPLE_AMM_ABI,
    functionName: 'reserves', args: [asset.contractAddress]
  }));
  const { data: reservesData } = useReadContracts({ contracts: reserveContracts as any });

  const sharesContracts = address ? deployedAssets.map(asset => ({
    address: SIMPLE_AMM_ADDRESS, abi: SIMPLE_AMM_ABI,
    functionName: 'liquidityShares', args: [address, asset.contractAddress]
  })) : [];
  const { data: sharesData } = useReadContracts({ contracts: sharesContracts as any });

  const { prices } = useMultiplePriceFeeds(deployedAssets.map(a => a.symbol));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#F0F0F0', margin: '0 0 4px' }}>Liquidity pools</h2>
        <div style={{ fontSize: '0.75rem', color: G.dim, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Provide liquidity and earn trading fees</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {deployedAssets.map((asset, index) => {
          const reserve = reservesData?.[index]?.result as bigint | undefined;
          const reserveFormatted = reserve ? Number(formatUnits(reserve, 18)) : 0;
          const price = prices[asset.symbol] || 0;
          const tvl = reserveFormatted * price;
          const userSharesBN = sharesData?.[index]?.result as bigint | undefined;
          const userSharesFormatted = userSharesBN ? Number(formatUnits(userSharesBN, 18)) : 0;

          return (
            <PoolCard key={asset.symbol} asset={asset} reserve={reserveFormatted}
              tvl={tvl} userShares={userSharesFormatted} address={address} />
          );
        })}
      </div>
    </div>
  );
};

export default LiquidityTab;
