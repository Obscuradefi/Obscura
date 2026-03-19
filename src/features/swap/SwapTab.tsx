import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { motion } from 'framer-motion';
import { parseUnits, formatUnits } from 'viem';
import { FLUX_ASSETS, getAsset } from '../../data/fluxAssets';
import { SIMPLE_AMM_ABI, SIMPLE_AMM_ADDRESS, ERC20_ABI } from '../../config/dexConfig';
import { useTokenApproval } from '../../hooks/useTokenApproval';
import { useTradeRouter } from '../../hooks/useTradeRouter';
import { addActivity } from '../../lib/fluxMock';

const TokenSelector = ({ value, options, onChange }: { value: string, options: string[], onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div className="token-selector-wrapper" ref={wrapperRef}>
            <div className="token-selector-trigger" onClick={() => setIsOpen(!isOpen)}>
                <span>{value}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', marginLeft: '8px' }}>▼</span>
            </div>
            {isOpen && (
                <div className="token-selector-dropdown">
                    {options.map(option => (
                        <div
                            key={option}
                            className={`token-option ${value === option ? 'selected' : ''}`}
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                            }}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SwapTab = () => {
    const { address, isConnected } = useAccount();

    const [fromAsset, setFromAsset] = useState('USDO');
    const [toAsset, setToAsset] = useState('AAPL');
    const [inputAmount, setInputAmount] = useState('');
    const [slippage, setSlippage] = useState('0.5');
    const [isCustomSlippage, setIsCustomSlippage] = useState(false);

    const fromAssetData = getAsset(fromAsset);
    const toAssetData = getAsset(toAsset);

    const fromTokenAddress = fromAssetData?.contractAddress;
    const toTokenAddress = toAssetData?.contractAddress;

    const availableAssets = FLUX_ASSETS.filter(a => a.deployed).map(a => a.symbol);
    const allowedToAssets = availableAssets.filter(symbol => symbol !== fromAsset);

    const { data: fromBalanceData } = useReadContract({
        address: fromTokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
        query: { enabled: !!address && !!fromTokenAddress }
    });

    const { data: toBalanceData } = useReadContract({
        address: toTokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
        query: { enabled: !!address && !!toTokenAddress }
    });

    const formattedFromBalance = fromBalanceData
        ? parseFloat(formatUnits(fromBalanceData as bigint, 18)).toString()
        : '0';

    const formattedToBalance = toBalanceData
        ? parseFloat(formatUnits(toBalanceData as bigint, 18)).toString()
        : '0';

    const { routeType, ammQuote, rfqQuotes, bestQuote, hasLiquidity } = useTradeRouter(
        fromTokenAddress,
        toTokenAddress,
        inputAmount,
        fromAsset,
        toAsset
    );

    const {
        needsApproval,
        handleApprove,
        isApprovePending,
        isApprovalConfirming,
        approvalHash
    } = useTokenApproval(fromTokenAddress, inputAmount);

    const {
        writeContract: executeSwap,
        data: swapHash,
        isPending: isSwapPending
    } = useWriteContract();

    const {
        isLoading: isSwapConfirming,
        isSuccess: isSwapConfirmed
    } = useWaitForTransactionReceipt({ hash: swapHash });

    const handleFlip = () => {
        setFromAsset(toAsset);
        setToAsset(fromAsset);
        setInputAmount('');
    };

    const handleExecuteSwap = async () => {
        if (!fromTokenAddress || !toTokenAddress || !inputAmount) return;

        try {
            const amountBN = parseUnits(inputAmount, 18);
            executeSwap({
                address: SIMPLE_AMM_ADDRESS,
                abi: SIMPLE_AMM_ABI,
                functionName: 'swap',
                args: [
                    fromTokenAddress as `0x${string}`,
                    toTokenAddress as `0x${string}`,
                    amountBN,
                    0n,
                ],
            });
        } catch (error) {
            console.error('Swap error:', error);
        }
    };

    useEffect(() => {
        if (isSwapConfirmed && inputAmount && bestQuote) {
            // Add swap activity to history
            addActivity({
                type: 'swap',
                description: `Swapped ${inputAmount} ${fromAsset} → ${bestQuote.amountOut.toFixed(4)} ${toAsset}`,
                fromAsset,
                toAsset,
                amount: parseFloat(inputAmount),
            });

            setInputAmount('');
        }
    }, [isSwapConfirmed, inputAmount, fromAsset, toAsset, bestQuote]);

    return (
        <div style={{ maxWidth: '550px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 className="glow-text" style={{ fontSize: '2rem', margin: 0 }}>SWAP</h2>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono', marginTop: '5px' }}>
                        // HYBRID AMM + RFQ ROUTING
                    </div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="cyber-card"
                style={{ padding: '30px' }}
            >
                <div style={{ marginBottom: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>FROM</label>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono' }}>
                            Balance: <span style={{ color: 'var(--neon-cyan)' }}>{formattedFromBalance}</span>
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="number"
                            className="cyber-input"
                            placeholder="0.00"
                            value={inputAmount}
                            onChange={(e) => setInputAmount(e.target.value)}
                            style={{ flex: 1, marginBottom: 0, fontSize: '1.5rem' }}
                        />
                        <TokenSelector
                            value={fromAsset}
                            options={availableAssets}
                            onChange={(val) => {
                                setFromAsset(val);
                                if (val === toAsset) {
                                    const available = availableAssets.filter(s => s !== val);
                                    if (available.length > 0) setToAsset(available[0]);
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="btn-flip-container">
                    <button onClick={handleFlip} className="btn-flip">
                        ⇅
                    </button>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>TO (ESTIMATED)</label>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono' }}>
                            Balance: <span style={{ color: 'var(--neon-cyan)' }}>{formattedToBalance}</span>
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            className="cyber-input"
                            placeholder="0.00"
                            readOnly
                            value={bestQuote?.amountOut ? bestQuote.amountOut.toFixed(6) : ''}
                            style={{ flex: 1, marginBottom: 0, fontSize: '1.5rem', color: 'var(--neon-cyan)' }}
                        />
                        <TokenSelector
                            value={toAsset}
                            options={allowedToAssets}
                            onChange={setToAsset}
                        />
                    </div>
                </div>

                {inputAmount && parseFloat(inputAmount) > 0 && bestQuote && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="quote-panel"
                    >
                        <div className="quote-row">
                            <span style={{ color: 'var(--text-dim)' }}>ROUTING</span>
                            <span style={{
                                color: routeType === 'RFQ' ? 'var(--neon-purple)' :
                                    routeType === 'HYBRID' ? 'var(--neon-cyan)' :
                                        'var(--neon-green)',
                                fontWeight: 'bold'
                            }}>
                                {routeType === 'RFQ' ? 'RFQ' :
                                    routeType === 'HYBRID' ? 'HYBRID (AMM + RFQ)' :
                                        'AMM (V2)'}
                            </span>
                        </div>
                        <div className="quote-row">
                            <span style={{ color: 'var(--text-dim)' }}>BEST QUOTE</span>
                            <span style={{ color: 'white' }}>
                                {bestQuote.amountOut.toFixed(4)} {toAsset}
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '8px' }}>
                                    ({bestQuote.source === 'RFQ' ? bestQuote.rfqQuote?.maker : 'AMM Pool'})
                                </span>
                            </span>
                        </div>
                        <div className="quote-row">
                            <span style={{ color: 'var(--text-dim)' }}>PRICE IMPACT</span>
                            <span style={{ color: bestQuote.priceImpact > 2 ? '#FF4444' : 'var(--neon-cyan)' }}>
                                {bestQuote.priceImpact.toFixed(2)}%
                            </span>
                        </div>
                        <div style={{ borderTop: '1px solid rgba(0,240,255,0.2)', margin: '10px 0' }} />
                        <div className="quote-row" style={{ fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-dim)' }}>AMM POOL RESERVES</span>
                            <span style={{ color: 'var(--text-dim)' }}>
                                {ammQuote.reserveIn.toFixed(0)} / {ammQuote.reserveOut.toFixed(0)}
                            </span>
                        </div>
                        <div className="quote-row" style={{ fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-dim)' }}>NETWORK FEE</span>
                            <span style={{ color: 'var(--text-dim)' }}>0.3%</span>
                        </div>
                    </motion.div>
                )}

                <div style={{ marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>SLIPPAGE TOLERANCE</span>
                        <span style={{ color: 'var(--neon-cyan)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>{slippage}%</span>
                    </div>
                    <div className="slippage-container">
                        {['0.1', '0.5', '1.0'].map((val) => (
                            <button
                                key={val}
                                className={`slippage-btn ${!isCustomSlippage && slippage === val ? 'active' : ''}`}
                                onClick={() => {
                                    setSlippage(val);
                                    setIsCustomSlippage(false);
                                }}
                            >
                                {val}%
                            </button>
                        ))}

                        {isCustomSlippage ? (
                            <input
                                autoFocus
                                type="number"
                                className="slippage-input"
                                value={slippage}
                                onChange={(e) => setSlippage(e.target.value)}
                                placeholder="Custom"
                            />
                        ) : (
                            <button
                                className="slippage-btn"
                                onClick={() => {
                                    setIsCustomSlippage(true);
                                    setSlippage('');
                                }}
                            >
                                Custom
                            </button>
                        )}
                    </div>
                </div>

                {!isConnected ? (
                    <button className="action-btn-large" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-dim)', cursor: 'not-allowed' }}>
                        CONNECT WALLET TO SWAP
                    </button>
                ) : !hasLiquidity && inputAmount ? (
                    <button className="action-btn-large" style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#FF4444', border: '1px solid #FF4444', cursor: 'not-allowed' }}>
                        INSUFFICIENT LIQUIDITY
                    </button>
                ) : needsApproval ? (
                    <button
                        className="action-btn-large btn-approve"
                        onClick={handleApprove}
                        disabled={isApprovePending || isApprovalConfirming}
                    >
                        {isApprovePending || isApprovalConfirming ? 'APPROVING TOKEN...' : `APPROVE ${fromAsset}`}
                    </button>
                ) : (
                    <button
                        className="action-btn-large btn-swap"
                        onClick={handleExecuteSwap}
                        disabled={!inputAmount || isSwapPending || isSwapConfirming}
                    >
                        {isSwapPending || isSwapConfirming ? 'SWAPPING...' : 'EXECUTE SWAP'}
                    </button>
                )}

                {approvalHash && (
                    <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        Approval Tx: <a href={`https://sepolia.basescan.org/tx/${approvalHash}`} target="_blank" style={{ color: 'var(--neon-cyan)' }}>View on Scan</a>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default SwapTab;