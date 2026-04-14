import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { motion } from 'framer-motion';
import { SIMPLE_AMM_ABI, SIMPLE_AMM_ADDRESS, ERC20_ABI } from '../../config/dexConfig';
import { FLUX_ASSETS, getAsset, isPairAllowed } from '../../data/fluxAssets';
import { useTokenApproval } from '../../hooks/useTokenApproval';
import { useTokenBalance } from '../../hooks/useTokenBalance';
import { addActivity } from '../../lib/fluxMock';

const G = {
  card: { background: 'rgba(13,13,18,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 },
  input: { background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.09)', color: '#F0F0F0', padding: '14px 18px', borderRadius: 12, fontSize: '1.35rem', width: '100%', outline: 'none', fontFamily: 'Inter, system-ui, sans-serif', transition: 'border-color 0.2s' },
  label: { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8, display: 'block' },
  green: 'var(--green-300)',
  greenMid: 'var(--green-500)',
  dim: 'var(--text-dim)',
  secondary: 'var(--text-secondary)',
};

const availableAssets = FLUX_ASSETS.filter(a => a.deployed).map(a => a.symbol);

function TokenSelector({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', minWidth: 120 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#F0F0F0', padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 700,
          transition: 'all 0.2s', whiteSpace: 'nowrap', width: '100%', justifyContent: 'space-between',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--green-600)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
      >
        {value}
        <span style={{ fontSize: '0.65rem', color: G.dim, marginLeft: 4 }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, right: 0,
          background: 'rgba(10,10,15,0.98)', border: '1px solid var(--glass-border)',
          borderRadius: 12, zIndex: 100, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'slideDown 0.15s ease-out',
        }}>
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                display: 'block', width: '100%', padding: '11px 16px',
                background: opt === value ? 'rgba(61,158,78,0.1)' : 'transparent',
                border: 'none', color: opt === value ? G.green : G.secondary,
                cursor: 'pointer', textAlign: 'left', fontSize: '0.92rem', fontWeight: opt === value ? 700 : 400,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = 'transparent'; }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function rfqQuote(from: string, to: string, amount: number) {
  const fromAsset = getAsset(from);
  const toAsset = getAsset(to);
  if (!fromAsset || !toAsset) return null;
  const rate = (fromAsset.mockPrice / toAsset.mockPrice) * (1 + (Math.random() * 0.006 - 0.003));
  return { maker: 'RFQ Maker 0x...a3f2', amountOut: amount * rate, fee: 0.001 };
}

function ammQuoteCalc(from: string, to: string, amount: number, reserveIn = 50000, reserveOut = 50000) {
  const fromAsset = getAsset(from);
  const toAsset = getAsset(to);
  if (!fromAsset || !toAsset) return { amountOut: 0, priceImpact: 0, reserveIn, reserveOut };
  const normalizedAmount = amount * fromAsset.mockPrice / toAsset.mockPrice;
  const k = reserveIn * reserveOut;
  const newReserveIn = reserveIn + normalizedAmount;
  const newReserveOut = k / newReserveIn;
  const amountOut = reserveOut - newReserveOut;
  const priceImpact = (normalizedAmount / reserveIn) * 100;
  return { amountOut: Math.max(0, amountOut), priceImpact, reserveIn, reserveOut };
}

const SwapTab: React.FC = () => {
  const [fromAsset, setFromAsset] = useState('USDO');
  const [toAsset, setToAsset] = useState('GOLD');
  const [inputAmount, setInputAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [isCustomSlippage, setIsCustomSlippage] = useState(false);
  const [routeType, setRouteType] = useState<'AMM' | 'RFQ' | 'HYBRID'>('AMM');

  const { address, isConnected } = useAccount();

  const fromAssetData = getAsset(fromAsset);
  const toAssetData = getAsset(toAsset);

  const { formattedBalance: fromBalance } = useTokenBalance(fromAssetData?.contractAddress, address);
  const { formattedBalance: toBalance } = useTokenBalance(toAssetData?.contractAddress, address);

  const amount = parseFloat(inputAmount) || 0;
  const ammQuote = ammQuoteCalc(fromAsset, toAsset, amount);
  const rfqQ = rfqQuote(fromAsset, toAsset, amount);
  const hasLiquidity = ammQuote.amountOut > 0;

  let bestQuote: { amountOut: number; priceImpact: number; source: 'AMM' | 'RFQ'; rfqQuote?: typeof rfqQ } | null = null;
  if (amount > 0) {
    if (rfqQ && rfqQ.amountOut > ammQuote.amountOut) {
      bestQuote = { amountOut: rfqQ.amountOut, priceImpact: 0, source: 'RFQ', rfqQuote: rfqQ };
      setRouteType !== routeType ? null : (() => { if (routeType !== 'RFQ') setRouteType('RFQ'); })();
    } else if (rfqQ && Math.abs(rfqQ.amountOut - ammQuote.amountOut) < ammQuote.amountOut * 0.005) {
      bestQuote = { amountOut: Math.max(rfqQ.amountOut, ammQuote.amountOut), priceImpact: ammQuote.priceImpact, source: 'RFQ' };
    } else {
      bestQuote = { amountOut: ammQuote.amountOut, priceImpact: ammQuote.priceImpact, source: 'AMM' };
    }
  }

  const allowedToAssets = availableAssets.filter(s => s !== fromAsset && isPairAllowed(fromAsset, s));

  const { needsApproval, handleApprove, isApprovalConfirmed, isApprovePending, isApprovalConfirming, approvalHash } = useTokenApproval(
    fromAssetData?.contractAddress, inputAmount
  );

  const { writeContract: execSwap, data: swapHash, isPending: isSwapPending } = useWriteContract();
  const { isLoading: isSwapConfirming, isSuccess: isSwapConfirmed } = useWaitForTransactionReceipt({ hash: swapHash });

  const handleFlip = () => {
    const tmp = fromAsset;
    setFromAsset(toAsset);
    setToAsset(tmp);
    setInputAmount('');
  };

  const handleExecuteSwap = () => {
    if (!fromAssetData?.contractAddress || !toAssetData?.contractAddress || !inputAmount) return;
    execSwap({
      address: SIMPLE_AMM_ADDRESS,
      abi: SIMPLE_AMM_ABI,
      functionName: 'swap',
      args: [fromAssetData.contractAddress as `0x${string}`, toAssetData.contractAddress as `0x${string}`, parseUnits(inputAmount, 18), 0n],
    }, {
      onSuccess: (hash) => {
        addActivity({ type: 'swap', description: `Swapped ${inputAmount} ${fromAsset} to ${toAsset}`, fromAsset, toAsset, amount });
      }
    });
  };

  useEffect(() => {
    if (isSwapConfirmed) setInputAmount('');
  }, [isSwapConfirmed]);

  const btnStyle = (variant: 'primary' | 'secondary' | 'ghost'): React.CSSProperties => ({
    width: '100%', padding: '15px', borderRadius: 12, fontWeight: 700,
    fontSize: '0.88rem', letterSpacing: '0.04em', textTransform: 'uppercase',
    cursor: 'pointer', transition: 'all 0.25s', border: '1px solid',
    ...(variant === 'primary' ? {
      background: 'rgba(61,158,78,0.15)', borderColor: 'var(--green-600)', color: 'var(--green-200)',
    } : variant === 'secondary' ? {
      background: 'transparent', borderColor: 'rgba(255,255,255,0.12)', color: G.secondary,
    } : {
      background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)', color: G.dim,
    }),
  });

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#F0F0F0', margin: 0 }}>Swap</h2>
        <div style={{ fontSize: '0.75rem', color: G.dim, marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Hybrid AMM and RFQ routing
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={G.card}>
        {}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={G.label}>From</span>
            <span style={{ fontSize: '0.75rem', color: G.dim }}>
              Balance <span style={{ color: G.green }}>{fromBalance}</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
            <input
              type="number" placeholder="0.00" value={inputAmount}
              onChange={e => setInputAmount(e.target.value)}
              style={{ ...G.input, flex: 1, paddingRight: 12 }}
              onFocus={e => (e.target.style.borderColor = 'var(--green-600)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
            />
            <TokenSelector value={fromAsset} options={availableAssets} onChange={v => { setFromAsset(v); if (v === toAsset) setToAsset(availableAssets.find(a => a !== v) || 'GOLD'); }} />
          </div>
        </div>

        {}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '-2px 0', position: 'relative', zIndex: 2 }}>
          <button
            onClick={handleFlip}
            style={{
              background: 'rgba(13,13,18,0.95)', border: '1px solid rgba(61,158,78,0.3)',
              color: 'var(--green-400)', width: 42, height: 42, borderRadius: '50%',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', transition: 'all 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--green-900)'; e.currentTarget.style.transform = 'rotate(180deg)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(13,13,18,0.95)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
          >
            ⇅
          </button>
        </div>

        {}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={G.label}>To (estimated)</span>
            <span style={{ fontSize: '0.75rem', color: G.dim }}>
              Balance <span style={{ color: G.green }}>{toBalance}</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
            <input
              type="text" placeholder="0.00" readOnly
              value={bestQuote?.amountOut ? bestQuote.amountOut.toFixed(6) : ''}
              style={{ ...G.input, flex: 1, color: G.green, paddingRight: 12 }}
            />
            <TokenSelector value={toAsset} options={allowedToAssets} onChange={setToAsset} />
          </div>
        </div>

        {/* Quote box */}
        {amount > 0 && bestQuote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            style={{
              background: 'rgba(61,158,78,0.05)', border: '1px solid rgba(61,158,78,0.15)',
              borderRadius: 12, padding: '16px 18px', marginBottom: 20,
            }}
          >
            {[
              { label: 'Routing', value: routeType === 'RFQ' ? 'RFQ' : routeType === 'HYBRID' ? 'Hybrid' : 'AMM', color: G.green },
              { label: 'Best quote', value: `${bestQuote.amountOut.toFixed(4)} ${toAsset}`, color: '#F0F0F0' },
              { label: 'Price impact', value: `${bestQuote.priceImpact.toFixed(2)}%`, color: bestQuote.priceImpact > 2 ? '#FF5577' : G.green },
              { label: 'Network fee', value: '0.3%', color: G.dim },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                <span style={{ color: G.dim }}>{row.label}</span>
                <span style={{ color: row.color, fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </motion.div>
        )}

        {}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={G.label}>Slippage tolerance</span>
            <span style={{ fontSize: '0.78rem', color: G.green, fontWeight: 600 }}>{slippage}%</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['0.1', '0.5', '1.0'].map(val => (
              <button
                key={val}
                onClick={() => { setSlippage(val); setIsCustomSlippage(false); }}
                style={{
                  flex: 1, padding: '9px', borderRadius: 8, cursor: 'pointer',
                  background: !isCustomSlippage && slippage === val ? 'rgba(61,158,78,0.12)' : 'transparent',
                  border: `1px solid ${!isCustomSlippage && slippage === val ? 'var(--green-600)' : 'rgba(255,255,255,0.08)'}`,
                  color: !isCustomSlippage && slippage === val ? G.green : G.dim,
                  fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s',
                }}
              >{val}%</button>
            ))}
            {isCustomSlippage ? (
              <input
                autoFocus type="number" value={slippage} onChange={e => setSlippage(e.target.value)}
                placeholder="Custom"
                style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'rgba(61,158,78,0.08)', border: '1px solid var(--green-600)', color: G.green, fontSize: '0.82rem', outline: 'none', textAlign: 'center' }}
              />
            ) : (
              <button
                onClick={() => { setIsCustomSlippage(true); setSlippage(''); }}
                style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: G.dim, fontSize: '0.82rem', cursor: 'pointer' }}
              >Custom</button>
            )}
          </div>
        </div>

        {}
        {!isConnected ? (
          <button style={{ ...btnStyle('ghost'), cursor: 'not-allowed', opacity: 0.5 }} disabled>Connect wallet to swap</button>
        ) : !hasLiquidity && amount > 0 ? (
          <button style={{ ...btnStyle('ghost'), cursor: 'not-allowed', borderColor: 'rgba(255,85,119,0.4)', color: '#FF5577' }} disabled>Insufficient liquidity</button>
        ) : needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={isApprovePending || isApprovalConfirming}
            style={{ ...btnStyle('primary'), opacity: isApprovePending || isApprovalConfirming ? 0.6 : 1 }}
            onMouseEnter={e => { if (!isApprovePending) { e.currentTarget.style.background = 'rgba(61,158,78,0.28)'; e.currentTarget.style.borderColor = 'var(--green-400)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(61,158,78,0.15)'; e.currentTarget.style.borderColor = 'var(--green-600)'; }}
          >
            {isApprovePending || isApprovalConfirming ? 'Approving...' : `Approve ${fromAsset}`}
          </button>
        ) : (
          <button
            onClick={handleExecuteSwap}
            disabled={!amount || isSwapPending || isSwapConfirming}
            style={{ ...btnStyle('primary'), opacity: !amount || isSwapPending || isSwapConfirming ? 0.6 : 1 }}
            onMouseEnter={e => { if (amount) { e.currentTarget.style.background = 'rgba(61,158,78,0.28)'; e.currentTarget.style.borderColor = 'var(--green-400)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(61,158,78,0.15)'; e.currentTarget.style.borderColor = 'var(--green-600)'; }}
          >
            {isSwapPending || isSwapConfirming ? 'Swapping...' : 'Execute swap'}
          </button>
        )}

        {approvalHash && (
          <div style={{ marginTop: 12, textAlign: 'center', fontSize: '0.75rem', color: G.dim }}>
            Approval tx: <a href={`https://sepolia.basescan.org/tx/${approvalHash}`} target="_blank" rel="noopener noreferrer" style={{ color: G.green }}>View on scan</a>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SwapTab;
