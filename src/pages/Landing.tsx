import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BackgroundGrid from '../components/BackgroundGrid';
import Footer from '../components/Footer';

/* ──────────────────────────────────────────────
   Demo Modal Component
   ────────────────────────────────────────────── */
interface DemoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    accentColor: string;
}

const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose, title, children, accentColor }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 2000,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px',
                }}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 30 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'rgba(10, 10, 25, 0.95)',
                        border: `1px solid ${accentColor}40`,
                        borderRadius: '20px',
                        maxWidth: '700px', width: '100%', maxHeight: '85vh',
                        overflowY: 'auto', padding: '40px',
                        boxShadow: `0 0 60px ${accentColor}20`,
                        scrollbarWidth: 'none',
                    }}
                    className="agent-chat-messages"
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <h3 style={{ color: accentColor, fontFamily: 'JetBrains Mono', fontSize: '1.3rem', margin: 0 }}>{title}</h3>
                        <button onClick={onClose} style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#888', width: '36px', height: '36px', borderRadius: '50%',
                            cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>✕</button>
                    </div>
                    {children}
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

/* ──────────────────────────────────────────────
   AMM Demo Content
   ────────────────────────────────────────────── */
const AMMDemoContent: React.FC = () => {
    const [inputAmt, setInputAmt] = useState(10);
    const reserveA = 1000;
    const reserveB = 5000;
    const k = reserveA * reserveB;
    const newReserveA = reserveA + inputAmt;
    const newReserveB = k / newReserveA;
    const output = reserveB - newReserveB;
    const priceImpact = ((inputAmt / reserveA) * 100).toFixed(2);

    return (
        <div>
            <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '25px' }}>
                The Automated Market Maker (AMM) uses the <strong style={{ color: 'var(--neon-cyan)' }}>constant product formula x × y = k</strong> to determine swap prices.
                Unlike orderbooks, AMMs provide instant liquidity at algorithmically determined prices.
            </p>

            {/* Visual Pool */}
            <div style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '16px', padding: '25px', marginBottom: '25px' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px', fontFamily: 'JetBrains Mono', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                    LIQUIDITY POOL — USDO / GOLD
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginBottom: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '5px' }}>💵</div>
                        <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--neon-cyan)', fontSize: '1.2rem' }}>{newReserveA.toFixed(0)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>USDO</div>
                    </div>
                    <div style={{ fontSize: '1.5rem', color: 'var(--text-dim)' }}>×</div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '5px' }}>🪙</div>
                        <div style={{ fontFamily: 'JetBrains Mono', color: '#FFD700', fontSize: '1.2rem' }}>{newReserveB.toFixed(2)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>GOLD</div>
                    </div>
                    <div style={{ fontSize: '1.5rem', color: 'var(--text-dim)' }}>=</div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--neon-purple)', fontSize: '1.2rem' }}>{k.toLocaleString()}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>k (constant)</div>
                    </div>
                </div>
            </div>

            {/* Interactive Slider */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Swap Amount (USDO)</span>
                    <span style={{ color: 'var(--neon-cyan)', fontFamily: 'JetBrains Mono' }}>{inputAmt}</span>
                </div>
                <input type="range" min="1" max="500" value={inputAmt} onChange={(e) => setInputAmt(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--neon-cyan)' }} />
            </div>

            {/* Results */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '10px', padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#00FF88', marginBottom: '5px' }}>YOU RECEIVE</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.2rem', color: 'white' }}>{output.toFixed(4)} GOLD</div>
                </div>
                <div style={{ background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '10px', padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#FF4444', marginBottom: '5px' }}>PRICE IMPACT</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.2rem', color: Number(priceImpact) > 5 ? '#FF4444' : 'white' }}>{priceImpact}%</div>
                </div>
            </div>

            <div style={{ marginTop: '25px', padding: '15px', background: 'rgba(138,43,226,0.08)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
                💡 <strong style={{ color: 'var(--neon-purple)' }}>Rialo Infrastructure:</strong> On Rialo mainnet, the AMM pool is natively integrated with
                reactive transactions — allowing automatic rebalancing, LP fee compounding, and liquidation protection without external keepers.
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────
   RFQ Demo Content
   ────────────────────────────────────────────── */
const RFQDemoContent: React.FC = () => {
    const [step, setStep] = useState(0);
    const steps = [
        { label: 'User requests quote', icon: '📤', detail: 'User wants to swap 100 USDO → AAPL' },
        { label: 'Market makers respond', icon: '🏦', detail: '3 market makers compete: Maker A (19.8), Maker B (19.95), Maker C (19.7)' },
        { label: 'Best price selected', icon: '✅', detail: 'Maker B wins: 19.95 AAPL (best rate, 0% slippage)' },
        { label: 'Atomic execution', icon: '⚡', detail: 'Swap settles on-chain in single transaction — no MEV, no frontrunning' },
    ];

    return (
        <div>
            <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '25px' }}>
                <strong style={{ color: 'var(--neon-purple)' }}>Request for Quote (RFQ)</strong> lets professional market makers compete to give you
                the best price. Unlike AMMs, there's <strong style={{ color: 'white' }}>zero slippage</strong> and <strong style={{ color: 'white' }}>zero price impact</strong>.
            </p>

            {/* Step Flow */}
            <div style={{ position: 'relative', marginBottom: '30px' }}>
                {steps.map((s, i) => (
                    <motion.div key={i}
                        initial={{ opacity: 0.4 }}
                        animate={{ opacity: step >= i ? 1 : 0.4 }}
                        style={{
                            display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '20px',
                            cursor: 'pointer', padding: '15px',
                            background: step === i ? 'rgba(138,43,226,0.1)' : 'transparent',
                            border: step === i ? '1px solid rgba(138,43,226,0.3)' : '1px solid transparent',
                            borderRadius: '12px', transition: 'all 0.3s',
                        }}
                        onClick={() => setStep(i)}
                    >
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: step >= i ? 'rgba(138,43,226,0.2)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${step >= i ? 'var(--neon-purple)' : 'rgba(255,255,255,0.1)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.2rem', flexShrink: 0,
                        }}>{s.icon}</div>
                        <div>
                            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.9rem', color: step >= i ? 'white' : 'var(--text-dim)', marginBottom: '4px' }}>{s.label}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{s.detail}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                <button onClick={() => setStep(Math.max(0, step - 1))}
                    style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'JetBrains Mono' }}>
                    ← PREV
                </button>
                <button onClick={() => setStep(Math.min(3, step + 1))}
                    style={{ flex: 1, padding: '10px', background: 'rgba(138,43,226,0.15)', border: '1px solid var(--neon-purple)', borderRadius: '8px', color: 'var(--neon-purple)', cursor: 'pointer', fontFamily: 'JetBrains Mono' }}>
                    NEXT →
                </button>
            </div>

            {/* Comparison mini */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '10px', padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#FF4444', marginBottom: '5px' }}>AMM SLIPPAGE</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.1rem', color: '#FF4444' }}>~2.5%</div>
                </div>
                <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '10px', padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#00FF88', marginBottom: '5px' }}>RFQ SLIPPAGE</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.1rem', color: '#00FF88' }}>0%</div>
                </div>
            </div>

            <div style={{ padding: '15px', background: 'rgba(138,43,226,0.08)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
                💡 <strong style={{ color: 'var(--neon-purple)' }}>Rialo Infrastructure:</strong> Rialo's reactive transactions enable RFQ makers to automatically
                respond to quote requests on-chain. Combined with the AMM, our hybrid router always finds the best execution path.
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────
   AI Agent Demo Content
   ────────────────────────────────────────────── */
const AIAgentDemoContent: React.FC = () => {
    const [chatStep, setChatStep] = useState(0);
    const chatFlow = [
        { role: 'user' as const, text: 'swap 5 USDO to GOLD' },
        { role: 'agent' as const, text: '📋 Swap Preview (parsed via regex)\n\n• From: 5 USDO\n• To: GOLD\n• Router: AMM (SimpleAMM)\n\nReady to execute?' },
        { role: 'user' as const, text: '✓ CONFIRM' },
        { role: 'agent' as const, text: '⏳ Approving USDO... Confirm in wallet.' },
        { role: 'agent' as const, text: '✅ Swap complete! 5 USDO → GOLD\n\n🔗 View on BaseScan' },
    ];
    const visibleMessages = chatFlow.slice(0, chatStep + 1);

    return (
        <div>
            <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: '25px' }}>
                Our <strong style={{ color: 'var(--neon-cyan)' }}>AI Swap Agent</strong> lets you trade using natural language.
                Just describe what you want — the AI parses your intent, shows a preview, and executes via your wallet.
            </p>

            {/* Simulated Chat */}
            <div style={{
                background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(0,240,255,0.2)',
                borderRadius: '16px', padding: '20px', marginBottom: '20px',
                minHeight: '250px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', paddingBottom: '12px', borderBottom: '1px solid rgba(0,240,255,0.1)' }}>
                    <span>🤖</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', color: 'var(--neon-cyan)' }}>AI SWAP AGENT</span>
                    <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 8px #00FF88' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {visibleMessages.map((msg, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                            <div style={{
                                background: msg.role === 'user' ? 'rgba(0,240,255,0.15)' : 'rgba(138,43,226,0.1)',
                                border: `1px solid ${msg.role === 'user' ? 'rgba(0,240,255,0.3)' : 'rgba(138,43,226,0.2)'}`,
                                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                padding: '10px 14px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)',
                                whiteSpace: 'pre-wrap', lineHeight: 1.5,
                            }}>{msg.text}</div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                <button onClick={() => setChatStep(Math.max(0, chatStep - 1))}
                    style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'JetBrains Mono' }}>
                    ← PREV
                </button>
                <button onClick={() => setChatStep(Math.min(chatFlow.length - 1, chatStep + 1))}
                    style={{ flex: 1, padding: '10px', background: 'rgba(0,240,255,0.15)', border: '1px solid var(--neon-cyan)', borderRadius: '8px', color: 'var(--neon-cyan)', cursor: 'pointer', fontFamily: 'JetBrains Mono' }}>
                    NEXT →
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {[
                    { label: 'PARSING', value: 'Regex + AI', color: 'var(--neon-cyan)' },
                    { label: 'MODEL', value: 'GLM-4.7', color: 'var(--neon-purple)' },
                    { label: 'COST', value: '~$0.001', color: '#00FF88' },
                ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px' }}>{s.label}</div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ padding: '15px', background: 'rgba(0,240,255,0.05)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
                💡 <strong style={{ color: 'var(--neon-cyan)' }}>Rialo Infrastructure:</strong> On Rialo mainnet, AI agents can be deployed as
                autonomous smart contracts using reactive transactions — executing trades, rebalancing, and managing positions 24/7 without human intervention.
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────
   Main Landing Component
   ────────────────────────────────────────────── */
const Landing = () => {
    const navigate = useNavigate();
    const [activeDemo, setActiveDemo] = useState<'amm' | 'rfq' | 'ai' | null>(null);

    const features = [
        { icon: '🔄', title: 'Smart Routing', description: 'Hybrid AMM + RFQ routing for best execution on every trade', color: 'var(--neon-cyan)' },
        { icon: '💰', title: 'Multi-Asset Support', description: 'Trade stablecoins, commodities, and tokenized stocks seamlessly', color: 'var(--neon-purple)' },
        { icon: '📊', title: 'Real-Time Markets', description: 'Live price feeds and comprehensive market data at your fingertips', color: 'var(--neon-cyan)' },
        { icon: '🤖', title: 'AI Agent Trading', description: 'Swap with natural language — just tell the AI what you want', color: 'var(--neon-purple)' },
        { icon: '📈', title: 'Portfolio Tracking', description: 'Monitor all your positions and activity history in one place', color: 'var(--neon-cyan)' },
        { icon: '💧', title: 'Liquidity Provision', description: 'Provide liquidity to pools and earn trading fees', color: 'var(--neon-purple)' },
    ];

    const assets = [
        { symbol: 'USDO', name: 'USDO', category: 'Stablecoin' },
        { symbol: 'USDT', name: 'Tether USD', category: 'Stablecoin' },
        { symbol: 'USDe', name: 'Ethena USDe', category: 'Stablecoin' },
        { symbol: 'GOLD', name: 'Gold Token', category: 'Commodity' },
        { symbol: 'AAPL', name: 'Apple Stock', category: 'Stock' },
        { symbol: 'MSTR', name: 'MicroStrategy Stock', category: 'Stock' },
    ];

    const howItWorks = [
        { step: 1, icon: '🔐', title: 'Deposit & Shield', description: 'Deposit tokens into the privacy layer. Shield your balance from public view using Rialo\'s REX encryption.', color: 'var(--neon-cyan)' },
        { step: 2, icon: '⚡', title: 'Swap & Trade', description: 'AI-powered routing finds the best price across AMM pools and RFQ market makers. Zero slippage, zero MEV.', color: 'var(--neon-purple)' },
        { step: 3, icon: '📈', title: 'Earn & Grow', description: 'Supply liquidity to pools, earn trading fees, and compound your rewards automatically on Rialo.', color: '#00FF88' },
    ];

    const comparisonData = [
        { feature: 'Privacy', tradDex: '❌ Public', cex: '❌ KYC Required', obscura: '✅ Shield / Unshield' },
        { feature: 'Swap Routing', tradDex: 'AMM Only', cex: 'Orderbook', obscura: '✅ Hybrid AMM + RFQ' },
        { feature: 'AI Agent', tradDex: '❌', cex: '❌', obscura: '✅ NLP Swap' },
        { feature: 'Self-Custody', tradDex: '✅', cex: '❌ Exchange holds', obscura: '✅' },
        { feature: 'Real-World Assets', tradDex: 'Limited', cex: 'Some', obscura: '✅ Stocks & Gold' },
        { feature: 'Liquidity Source', tradDex: 'LP Pools', cex: 'Maker/Taker', obscura: '✅ LP + RFQ Makers' },
        { feature: 'MEV Protection', tradDex: '❌', cex: 'N/A', obscura: '✅ RFQ Atomic' },
    ];

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
            <BackgroundGrid />

            <div style={{ position: 'relative', zIndex: 10 }}>
                <Navbar />

                {/* ═══════════════════ HERO ═══════════════════ */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '0 20px', textAlign: 'center', paddingTop: '80px' }}>
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        {/* Badge */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.25)', borderRadius: '30px', marginBottom: '30px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 10px #00FF88' }} />
                            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: 'var(--neon-cyan)', letterSpacing: '1px' }}>BUILT ON RIALO INFRASTRUCTURE</span>
                        </motion.div>

                        <img src="/Logo 2.jpg" alt="Rialo Obscura"
                            style={{ width: '120px', marginBottom: '40px', borderRadius: '50%', border: '3px solid var(--neon-cyan)', boxShadow: '0 0 40px rgba(0, 240, 255, 0.3)', display: 'block', margin: '0 auto 40px' }} />

                        <h1 className="glow-text" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', marginBottom: '20px', letterSpacing: '3px', fontFamily: 'Rajdhani' }}>
                            RIALO OBSCURA
                        </h1>

                        <p style={{ color: 'var(--neon-cyan)', fontSize: '1.5rem', marginBottom: '15px', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '2px' }}>
                            The Shadow Layer
                        </p>

                        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginBottom: '50px', maxWidth: '750px', lineHeight: '1.8', margin: '0 auto 50px' }}>
                            Next-generation DeFi platform with AI-powered trading, hybrid AMM+RFQ routing, encrypted vaults, and on-chain privacy.
                            <br />Simulating the Rialo Network on Base Sepolia Testnet.
                        </p>

                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn-primary" onClick={() => navigate('/app')}
                                style={{ fontSize: '1.1rem', padding: '18px 50px' }}>
                                LAUNCH APP →
                            </button>
                            <button className="btn-purple" onClick={() => document.getElementById('demos')?.scrollIntoView({ behavior: 'smooth' })}
                                style={{ fontSize: '1.1rem', padding: '18px 40px' }}>
                                EXPLORE DEMOS ↓
                            </button>
                        </div>

                        <div style={{ marginTop: '80px', display: 'flex', gap: '60px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {[
                                { icon: '🔒', label: 'Private', color: 'var(--neon-cyan)' },
                                { icon: '⚡', label: 'Fast', color: 'var(--neon-purple)' },
                                { icon: '🤖', label: 'AI-Powered', color: 'var(--neon-cyan)' },
                                { icon: '🛡️', label: 'Secure', color: 'var(--neon-purple)' },
                            ].map(item => (
                                <div key={item.label}>
                                    <div style={{ color: item.color, fontSize: '2rem', fontFamily: 'JetBrains Mono', marginBottom: '10px' }}>{item.icon}</div>
                                    <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '100px 20px' }}>
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 className="glow-text" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '20px', fontFamily: 'Rajdhani' }}>HOW IT WORKS</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', fontFamily: 'JetBrains Mono' }}>// THREE STEPS TO PRIVATE DEFI</p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                        {howItWorks.map((item, index) => (
                            <motion.div key={item.step}
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.15 }}
                                className="cyber-card"
                                style={{ padding: '40px 30px', textAlign: 'center', position: 'relative', borderColor: item.color, overflow: 'visible' }}>
                                {/* Step Number */}
                                <div style={{
                                    position: 'absolute', top: '-18px', left: '20px',
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: item.color, color: '#000', fontFamily: 'JetBrains Mono',
                                    fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 0 20px ${item.color}60`,
                                }}>{item.step}</div>
                                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>{item.icon}</div>
                                <h3 style={{ color: item.color, fontSize: '1.3rem', marginBottom: '15px', fontFamily: 'Rajdhani', fontWeight: 'bold' }}>{item.title}</h3>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: '1.6' }}>{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ═══════════════════ INTERACTIVE DEMOS ═══════════════════ */}
                <div id="demos" style={{ maxWidth: '1400px', margin: '0 auto', padding: '100px 20px' }}>
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 className="glow-text" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '20px', fontFamily: 'Rajdhani' }}>INTERACTIVE DEMOS</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', fontFamily: 'JetBrains Mono', maxWidth: '700px', margin: '0 auto' }}>
                            // EXPLORE OUR CORE TECHNOLOGY — CLICK "TRY DEMO" TO SEE IT IN ACTION
                        </p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
                        {[
                            {
                                id: 'amm' as const, icon: '⚙️', title: 'AMM ENGINE', subtitle: 'Constant Product Market Maker',
                                description: 'See how the x × y = k formula determines swap prices. Adjust the trade size and watch reserves change in real time.',
                                color: 'var(--neon-cyan)',
                                code: 'x × y = k → SWAP(USDO, GOLD)',
                            },
                            {
                                id: 'rfq' as const, icon: '🏦', title: 'RFQ SYSTEM', subtitle: 'Request for Quote Protocol',
                                description: 'Watch market makers compete for your order. The best price wins — zero slippage, zero MEV, atomic execution.',
                                color: 'var(--neon-purple)',
                                code: 'REQUEST → QUOTE → MATCH → SETTLE',
                            },
                            {
                                id: 'ai' as const, icon: '🤖', title: 'AI AGENT', subtitle: 'Natural Language Trading',
                                description: 'Type "swap 5 USDO to GOLD" and watch the AI parse, preview, and execute your trade with a single wallet confirmation.',
                                color: '#00FF88',
                                code: '"swap 5 USDO to GOLD" → EXECUTE',
                            },
                        ].map((demo, index) => (
                            <motion.div key={demo.id}
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -8 }}
                                className="cyber-card"
                                style={{ padding: '35px 30px', cursor: 'default', borderColor: demo.color }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>{demo.icon}</div>
                                <h3 style={{ color: demo.color, fontSize: '1.3rem', marginBottom: '5px', fontFamily: 'Rajdhani', fontWeight: 'bold' }}>{demo.title}</h3>
                                <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontFamily: 'JetBrains Mono', marginBottom: '15px' }}>{demo.subtitle}</div>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>{demo.description}</p>
                                
                                {/* Code snippet */}
                                <div style={{
                                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '8px', padding: '10px 16px', marginBottom: '20px',
                                    fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: demo.color,
                                }}>{demo.code}</div>

                                <button onClick={() => setActiveDemo(demo.id)}
                                    style={{
                                        width: '100%', padding: '12px', background: `${demo.color}15`,
                                        border: `1px solid ${demo.color}`, borderRadius: '10px',
                                        color: demo.color, fontFamily: 'JetBrains Mono', fontWeight: 'bold',
                                        fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.3s',
                                        letterSpacing: '1px',
                                    }}>
                                    TRY DEMO →
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ═══════════════════ COMPARISON TABLE ═══════════════════ */}
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 20px' }}>
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 className="glow-text" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '20px', fontFamily: 'Rajdhani' }}>WHY OBSCURA?</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', fontFamily: 'JetBrains Mono' }}>// SEE HOW WE COMPARE</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="cyber-card" style={{ overflow: 'hidden', borderColor: 'var(--neon-cyan)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'JetBrains Mono', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(0,240,255,0.2)' }}>
                                        <th style={{ padding: '20px', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 'normal' }}>FEATURE</th>
                                        <th style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontWeight: 'normal' }}>TRAD. DEX</th>
                                        <th style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontWeight: 'normal' }}>CEX</th>
                                        <th style={{ padding: '20px', textAlign: 'center', color: 'var(--neon-cyan)', fontWeight: 'bold', background: 'rgba(0,240,255,0.05)' }}>OBSCURA ✦</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonData.map((row, i) => (
                                        <tr key={row.feature} style={{ borderBottom: i < comparisonData.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                            <td style={{ padding: '16px 20px', color: 'white', fontWeight: 'bold' }}>{row.feature}</td>
                                            <td style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>{row.tradDex}</td>
                                            <td style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>{row.cex}</td>
                                            <td style={{ padding: '16px 20px', textAlign: 'center', color: '#00FF88', background: 'rgba(0,240,255,0.03)', fontWeight: 'bold' }}>{row.obscura}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>

                {/* ═══════════════════ RIALO INFRASTRUCTURE ═══════════════════ */}
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '100px 20px' }}>
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 className="glow-text" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '20px', fontFamily: 'Rajdhani' }}>POWERED BY RIALO</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', fontFamily: 'JetBrains Mono', maxWidth: '700px', margin: '0 auto' }}>
                            // OBSCURA IS BUILT ON RIALO'S UNIQUE BLOCKCHAIN INFRASTRUCTURE
                        </p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '50px' }}>
                        {[
                            {
                                icon: '⚡', title: 'Reactive Transactions',
                                description: 'Native conditional execution built into the blockchain. Define predicates, attach actions — no bots, no keepers, no cron jobs.',
                                color: 'var(--neon-cyan)',
                                link: 'https://reactive-transactions.learn.rialo.io/',
                            },
                            {
                                icon: '🔐', title: 'REX Privacy Layer',
                                description: 'Shield and unshield tokens seamlessly. Your balances are encrypted on-chain — only you control visibility.',
                                color: 'var(--neon-purple)',
                                link: 'https://learn.rialo.io/',
                            },
                            {
                                icon: '📡', title: 'On-Chain Data Feeds',
                                description: 'Real-time price oracles via Pyth Network. Natively integrated with reactive transactions for automated strategies.',
                                color: '#00FF88',
                                link: 'https://learn.rialo.io/',
                            },
                            {
                                icon: '🧠', title: 'AI-Native Blockchain',
                                description: 'Deploy AI agents as autonomous smart contracts. Verifiable inference, on-chain reasoning, and automated portfolio management.',
                                color: '#FFD700',
                                link: 'https://learn.rialo.io/',
                            },
                        ].map((item, index) => (
                            <motion.div key={item.title}
                                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                                className="cyber-card"
                                style={{ padding: '35px 25px', borderColor: item.color }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>{item.icon}</div>
                                <h3 style={{ color: item.color, fontSize: '1.2rem', marginBottom: '12px', fontFamily: 'Rajdhani', fontWeight: 'bold' }}>{item.title}</h3>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: '1.6' }}>{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ═══════════════════ FEATURES (existing) ═══════════════════ */}
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '100px 20px' }}>
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 className="glow-text" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '20px', fontFamily: 'Rajdhani' }}>PLATFORM FEATURES</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', fontFamily: 'JetBrains Mono' }}>// EVERYTHING YOU NEED FOR ADVANCED DEFI</p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                        {features.map((feature, index) => (
                            <motion.div key={feature.title}
                                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                                className="cyber-card"
                                style={{ padding: '40px 30px', textAlign: 'center', cursor: 'default', borderColor: feature.color }}>
                                <div style={{ fontSize: '3rem', marginBottom: '20px', filter: `drop-shadow(0 0 10px ${feature.color})` }}>{feature.icon}</div>
                                <h3 style={{ color: feature.color, fontSize: '1.3rem', marginBottom: '15px', fontFamily: 'Rajdhani', fontWeight: 'bold' }}>{feature.title}</h3>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: '1.6' }}>{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ═══════════════════ SUPPORTED ASSETS (existing) ═══════════════════ */}
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '100px 20px' }}>
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 className="glow-text" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '20px', fontFamily: 'Rajdhani' }}>SUPPORTED ASSETS</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', fontFamily: 'JetBrains Mono' }}>// 6 ASSETS READY FOR TRADING</p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
                        {assets.map((asset, index) => (
                            <motion.div key={asset.symbol}
                                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.08 }}
                                whileHover={{ scale: 1.05 }}
                                className="cyber-card"
                                style={{ padding: '30px 25px', textAlign: 'center', cursor: 'default' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>
                                    {asset.category === 'Stablecoin' ? '💵' : asset.category === 'Commodity' ? '🪙' : '📈'}
                                </div>
                                <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '8px', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }}>{asset.symbol}</h3>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '12px' }}>{asset.name}</p>
                                <span style={{ display: 'inline-block', padding: '5px 15px', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--neon-cyan)', borderRadius: '20px', fontSize: '0.75rem', color: 'var(--neon-cyan)', fontFamily: 'JetBrains Mono' }}>
                                    {asset.category}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ═══════════════════ PLATFORM STATS + CTA (existing) ═══════════════════ */}
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 20px 80px' }}>
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="cyber-card"
                        style={{ padding: '60px 40px', textAlign: 'center', background: 'rgba(0, 240, 255, 0.05)', borderColor: 'var(--neon-cyan)' }}>
                        <h2 className="glow-text" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '50px', fontFamily: 'Rajdhani' }}>PLATFORM STATISTICS</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
                            {[
                                { value: '6', label: 'SUPPORTED ASSETS', color: 'var(--neon-cyan)' },
                                { value: '3', label: 'ROUTING OPTIONS', color: 'var(--neon-purple)' },
                                { value: 'RIALO', label: 'SIMULATION (BASE SEPOLIA)', color: 'var(--neon-cyan)' },
                                { value: '🔐', label: 'ENCRYPTED VAULTS', color: 'var(--neon-purple)' },
                            ].map(stat => (
                                <div key={stat.label}>
                                    <div style={{ fontSize: stat.value.length > 3 ? '2rem' : '3rem', fontFamily: 'JetBrains Mono', color: stat.color, marginBottom: '10px', fontWeight: 'bold' }}>{stat.value}</div>
                                    <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontFamily: 'JetBrains Mono' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '60px' }}>
                            <button className="btn-primary" onClick={() => navigate('/app')} style={{ fontSize: '1.2rem', padding: '20px 60px' }}>
                                GET STARTED →
                            </button>
                        </div>
                    </motion.div>
                </div>

                <Footer />
            </div>

            {/* ═══════════════════ DEMO MODALS ═══════════════════ */}
            <DemoModal isOpen={activeDemo === 'amm'} onClose={() => setActiveDemo(null)} title="⚙️ AMM ENGINE DEMO" accentColor="#00F0FF">
                <AMMDemoContent />
            </DemoModal>

            <DemoModal isOpen={activeDemo === 'rfq'} onClose={() => setActiveDemo(null)} title="🏦 RFQ SYSTEM DEMO" accentColor="#8A2BE2">
                <RFQDemoContent />
            </DemoModal>

            <DemoModal isOpen={activeDemo === 'ai'} onClose={() => setActiveDemo(null)} title="🤖 AI AGENT DEMO" accentColor="#00FF88">
                <AIAgentDemoContent />
            </DemoModal>
        </div>
    );
};

export default Landing;