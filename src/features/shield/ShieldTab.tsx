import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { addActivity } from '../../lib/fluxMock';
import { SHIELD_CONTRACT_ADDRESS, SHIELD_ABI } from '../../config/shieldConfig';
import { ERC20_ABI } from '../../config/dexConfig';

const RIALO_USDC_ADDRESS = '0x191798C747807ae164f2a28fA5DFb5145AcE4b6B';
const BALANCE_ABI = [
  { inputs: [{ internalType: 'address', name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' }
];

const G = {
  green: 'var(--green-300)',
  greenMid: 'var(--green-500)',
  greenBg: 'rgba(61,158,78,0.06)',
  greenBorder: 'rgba(61,158,78,0.2)',
  dim: 'var(--text-dim)',
  secondary: 'var(--text-secondary)',
  card: { background: 'rgba(13,13,18,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 28px' } as React.CSSProperties,
  label: { fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 } as React.CSSProperties,
};

const ShieldTab: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [shieldAmount, setShieldAmount] = useState('');
  const [unshieldAmount, setUnshieldAmount] = useState('');
  const [showEncrypted, setShowEncrypted] = useState(false);

  const { data: balanceData, refetch: refetchPublic } = useReadContract({
    address: RIALO_USDC_ADDRESS, abi: BALANCE_ABI, functionName: 'balanceOf',
    args: [address as `0x${string}`], query: { enabled: isConnected && !!address }
  });

  const { data: encryptedBalanceData, refetch: refetchPrivate } = useReadContract({
    address: SHIELD_CONTRACT_ADDRESS, abi: SHIELD_ABI, functionName: 'getEncryptedBalance',
    args: [address as `0x${string}`, RIALO_USDC_ADDRESS], query: { enabled: isConnected && !!address }
  });

  const encryptedBalanceVal = encryptedBalanceData ? parseFloat(formatUnits(encryptedBalanceData as bigint, 18)) : 0;
  const formattedBalance = balanceData ? formatUnits(balanceData as bigint, 18) : '0';

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  if (isConfirmed) { refetchPublic(); refetchPrivate(); }

  const handleShield = () => {
    if (!shieldAmount || isNaN(Number(shieldAmount))) return;
    writeContract({ address: RIALO_USDC_ADDRESS, abi: ERC20_ABI, functionName: 'approve', args: [SHIELD_CONTRACT_ADDRESS, parseUnits(shieldAmount, 18)] });
  };

  const executeShield = () => {
    if (!shieldAmount || isNaN(Number(shieldAmount))) return;
    writeContract({ address: SHIELD_CONTRACT_ADDRESS, abi: SHIELD_ABI, functionName: 'shield', args: [RIALO_USDC_ADDRESS, parseUnits(shieldAmount, 18)] }, {
      onSuccess: () => { addActivity({ type: 'shield', description: `Shielded ${shieldAmount} USDO` }); setShieldAmount(''); }
    });
  };

  const handleUnshield = () => {
    if (!unshieldAmount || isNaN(Number(unshieldAmount))) return;
    writeContract({ address: SHIELD_CONTRACT_ADDRESS, abi: SHIELD_ABI, functionName: 'unshield', args: [RIALO_USDC_ADDRESS, parseUnits(unshieldAmount, 18)] }, {
      onSuccess: () => { addActivity({ type: 'unshield', description: `Unshielded ${unshieldAmount} USDO` }); setUnshieldAmount(''); }
    });
  };

  if (!isConnected) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ ...G.card, textAlign: 'center', maxWidth: 480, padding: '60px 48px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: G.greenBg, border: `1px solid ${G.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '1.6rem' }}>
            🔒
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#F0F0F0', marginBottom: 10 }}>Access restricted</h2>
          <p style={{ color: G.secondary, marginBottom: 28, fontSize: '0.9rem', lineHeight: 1.65 }}>
            Connect your wallet to access the Obscura Shield Protocol.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ConnectButton label="Connect wallet" />
          </div>
        </motion.div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.09)',
    color: '#F0F0F0', padding: '13px 80px 13px 16px', borderRadius: 12,
    fontSize: '1.1rem', outline: 'none', width: '100%',
    fontFamily: 'Inter, system-ui, sans-serif', transition: 'border-color 0.2s',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#F0F0F0', margin: '0 0 4px' }}>Vault</h2>
        <div style={{ fontSize: '0.75rem', color: G.dim, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Privacy operations protocol</div>
      </div>

      {}
      <div style={{ ...G.card, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(61,158,78,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ fontSize: '0.7rem', color: G.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Total unshielded balance</div>
        <div style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1 }}>
          ${formattedBalance === '0' ? '0.00' : parseFloat(formattedBalance).toFixed(2)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-light)', boxShadow: '0 0 6px var(--accent-light)', animation: 'pulse-dot 2s infinite' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--green-300)' }}>Privacy shield active</span>
        </div>
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {}
        <div style={G.card}>
          <div style={{ ...G.label, color: 'var(--green-400)', marginBottom: 20 }}>Public wallet</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, background: 'rgba(61,158,78,0.12)', border: '1px solid var(--green-700)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', color: 'var(--green-300)' }}>$</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#F0F0F0' }}>USDO</div>
              <div style={{ color: G.dim, fontSize: '0.8rem' }}>Base Sepolia</div>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F0F0F0' }}>{parseFloat(formattedBalance).toFixed(2)}</div>
          </div>

          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input type="text" placeholder="0.00" value={shieldAmount} onChange={e => setShieldAmount(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--green-600)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')} />
            <button onClick={() => setShieldAmount(formattedBalance)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(61,158,78,0.1)', border: '1px solid var(--green-700)', color: 'var(--green-300)', padding: '5px 12px', borderRadius: 7, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
              MAX
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleShield}
              style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(61,158,78,0.08)', border: '1px solid var(--green-700)', color: 'var(--green-200)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.04em' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(61,158,78,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(61,158,78,0.08)'; }}>
              1. Approve
            </button>
            <button onClick={executeShield}
              style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'rgba(61,158,78,0.15)', border: '1px solid var(--green-600)', color: 'var(--green-100)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.04em' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(61,158,78,0.28)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(61,158,78,0.15)'; }}>
              2. Shield
            </button>
          </div>
        </div>

        {}
        <div style={{ ...G.card, border: '1px solid rgba(157,78,221,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ ...G.label, color: 'var(--neon-purple)', margin: 0 }}>Encrypted vault</div>
            <button onClick={() => setShowEncrypted(!showEncrypted)}
              style={{ background: 'rgba(157,78,221,0.08)', border: '1px solid rgba(157,78,221,0.2)', color: 'var(--neon-purple)', padding: '5px 12px', borderRadius: 7, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              {showEncrypted ? 'Hide' : 'Reveal'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, background: 'rgba(157,78,221,0.12)', border: '1px solid rgba(157,78,221,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🔒</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#F0F0F0' }}>cUSDO</div>
              <div style={{ color: G.dim, fontSize: '0.8rem' }}>Obscura Privacy Layer</div>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--neon-purple)', letterSpacing: showEncrypted ? '0' : '4px' }}>
              {showEncrypted ? encryptedBalanceVal.toFixed(2) : '••••••'}
            </div>
          </div>

          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input type="text" placeholder="0.00" value={unshieldAmount} onChange={e => setUnshieldAmount(e.target.value)}
              style={{ ...inputStyle, borderColor: 'rgba(157,78,221,0.25)' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(157,78,221,0.6)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(157,78,221,0.25)')} />
            <button onClick={() => setUnshieldAmount(encryptedBalanceVal.toString())}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.3)', color: 'var(--neon-purple)', padding: '5px 12px', borderRadius: 7, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
              MAX
            </button>
          </div>

          <button onClick={handleUnshield}
            style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.3)', color: 'var(--neon-purple)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.04em' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(157,78,221,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(157,78,221,0.1)'; }}>
            Unshield assets
          </button>
        </div>
      </div>

      {hash && (
        <div style={{ textAlign: 'center', fontSize: '0.77rem', color: G.dim }}>
          <a href={`https://sepolia.basescan.org/tx/${hash}`} target="_blank" rel="noopener noreferrer" style={{ color: G.green }}>
            {isConfirming ? 'Confirming...' : 'Confirmed'} — View transaction
          </a>
        </div>
      )}
    </motion.div>
  );
};

export default ShieldTab;
