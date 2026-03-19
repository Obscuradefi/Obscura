import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { parseSwapIntent, ParseResult, SwapIntent } from '../../lib/parseSwapIntent';
import { getAsset, isPairAllowed, FLUX_ASSETS } from '../../data/fluxAssets';
import { SIMPLE_AMM_ABI, SIMPLE_AMM_ADDRESS, ERC20_ABI } from '../../config/dexConfig';
import { SHIELD_ABI, SHIELD_CONTRACT_ADDRESS, PRIVACY_TOKENS } from '../../config/shieldConfig';
import { useTokenApproval } from '../../hooks/useTokenApproval';
import { addActivity } from '../../lib/fluxMock';

interface ChatMessage {
    role: 'user' | 'agent';
    content: string;
    intent?: SwapIntent;
    showConfirm?: boolean;
    txHash?: string;
}

type AgentStep = 'idle' | 'approving' | 'swapping' | 'done';
type PendingAction = 
    | { type: 'swap'; intent: SwapIntent }
    | { type: 'shield'; action: 'shield' | 'unshield'; token: string; amount: number }
    | null;

const SwapAgent: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'agent', content: '🤖 Hi! I\'m your AI Trading Agent. I can:\n\n• Swap: "swap 5 USDO to GOLD"\n• Shield: "shield 10 USDO"\n• Unshield: "unshield 5 USDO"\n• Portfolio: "cek portfolio"' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<AgentStep>('idle');
    const [pending, setPending] = useState<PendingAction>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { address, isConnected } = useAccount();

    // Determine token + amount + spender for approval based on pending action
    const approvalTokenAddress = pending
        ? pending.type === 'swap'
            ? getAsset(pending.intent.from)?.contractAddress
            : getAsset(pending.token)?.contractAddress
        : undefined;

    const approvalAmount = pending
        ? pending.type === 'swap'
            ? pending.intent.amount.toString()
            : pending.amount.toString()
        : '';

    const approvalSpender = pending?.type === 'shield'
        ? (SHIELD_CONTRACT_ADDRESS as `0x${string}`)
        : undefined; // defaults to SIMPLE_AMM_ADDRESS

    const {
        needsApproval,
        handleApprove,
        isApprovalConfirmed,
        approveError,
    } = useTokenApproval(approvalTokenAddress, approvalAmount, approvalSpender);

    // Swap execution
    const {
        writeContract: executeSwap,
        data: swapTxHash,
        error: swapWriteError,
    } = useWriteContract();

    const { isSuccess: isSwapConfirmed } = useWaitForTransactionReceipt({ hash: swapTxHash });

    // Shield execution
    const {
        writeContract: executeShield,
        data: shieldTxHash,
        error: shieldWriteError,
    } = useWriteContract();

    const { isSuccess: isShieldConfirmed } = useWaitForTransactionReceipt({ hash: shieldTxHash });

    // ── helpers ──
    const addMsg = (content: string, extra?: Partial<ChatMessage>) => {
        setMessages(prev => [...prev, { role: 'agent', content, ...extra }]);
    };

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Effect: approval confirmed → fire swap / shield ──
    useEffect(() => {
        if (!isApprovalConfirmed || step !== 'approving' || !pending) return;

        if (pending.type === 'swap') {
            setStep('swapping');
            addMsg('✅ Approved! Executing swap... Confirm in your wallet.');
            const from = getAsset(pending.intent.from);
            const to = getAsset(pending.intent.to);
            if (from?.contractAddress && to?.contractAddress) {
                executeSwap({
                    address: SIMPLE_AMM_ADDRESS,
                    abi: SIMPLE_AMM_ABI,
                    functionName: 'swap',
                    args: [
                        from.contractAddress as `0x${string}`,
                        to.contractAddress as `0x${string}`,
                        parseUnits(pending.intent.amount.toString(), 18),
                        0n,
                    ],
                });
            }
        } else if (pending.type === 'shield') {
            setStep('swapping');
            addMsg(`✅ Approved! Executing ${pending.action}...`);
            const asset = getAsset(pending.token);
            if (asset?.contractAddress) {
                executeShield({
                    address: SHIELD_CONTRACT_ADDRESS as `0x${string}`,
                    abi: SHIELD_ABI,
                    functionName: pending.action,
                    args: [
                        asset.contractAddress as `0x${string}`,
                        parseUnits(pending.amount.toString(), 18),
                    ],
                });
            }
        }
    }, [isApprovalConfirmed]);

    // ── Effect: approval error → reset ──
    useEffect(() => {
        if (approveError && step === 'approving') {
            addMsg('❌ Approval rejected or failed. You can try again!');
            setStep('idle');
        }
    }, [approveError]);

    // ── Effect: swap write error → reset ──
    useEffect(() => {
        if (swapWriteError && step === 'swapping') {
            addMsg('❌ Swap rejected or failed. You can try again!');
            setStep('idle');
        }
    }, [swapWriteError]);

    // ── Effect: shield write error → reset ──
    useEffect(() => {
        if (shieldWriteError && step === 'swapping') {
            addMsg('❌ Transaction rejected or failed. You can try again!');
            setStep('idle');
        }
    }, [shieldWriteError]);

    // ── Effect: swap confirmed on-chain ──
    useEffect(() => {
        if (!isSwapConfirmed || !pending || pending.type !== 'swap') return;
        addMsg(
            `✅ Swap complete! ${pending.intent.amount} ${pending.intent.from} → ${pending.intent.to}`,
            { txHash: swapTxHash },
        );
        addActivity({
            type: 'swap',
            description: `AI Agent: Swapped ${pending.intent.amount} ${pending.intent.from} → ${pending.intent.to}`,
            fromAsset: pending.intent.from,
            toAsset: pending.intent.to,
            amount: pending.intent.amount,
        });
        setPending(null);
        setStep('idle');
    }, [isSwapConfirmed]);

    // ── Effect: shield confirmed on-chain ──
    useEffect(() => {
        if (!isShieldConfirmed || !pending || pending.type !== 'shield') return;
        const verb = pending.action === 'shield' ? 'Shielded' : 'Unshielded';
        addMsg(
            `✅ ${verb}! ${pending.amount} ${pending.token}`,
            { txHash: shieldTxHash },
        );
        addActivity({
            type: pending.action,
            description: `AI Agent: ${verb} ${pending.amount} ${pending.token}`,
            fromAsset: pending.token,
            amount: pending.amount,
        });
        setPending(null);
        setStep('idle');
    }, [isShieldConfirmed]);

    // ── Confirm button handler ──
    const handleConfirm = () => {
        if (!pending) return;

        if (needsApproval) {
            // Step 1: approve first
            setStep('approving');
            const tokenName = pending.type === 'swap' ? pending.intent.from : pending.token;
            addMsg(`⏳ Approving ${tokenName}... Please confirm in your wallet.`);
            handleApprove();
        } else {
            // Already approved → execute directly
            if (pending.type === 'swap') {
                setStep('swapping');
                addMsg('⏳ Executing swap... Please confirm in your wallet.');
                const from = getAsset(pending.intent.from);
                const to = getAsset(pending.intent.to);
                if (from?.contractAddress && to?.contractAddress) {
                    executeSwap({
                        address: SIMPLE_AMM_ADDRESS,
                        abi: SIMPLE_AMM_ABI,
                        functionName: 'swap',
                        args: [
                            from.contractAddress as `0x${string}`,
                            to.contractAddress as `0x${string}`,
                            parseUnits(pending.intent.amount.toString(), 18),
                            0n,
                        ],
                    });
                }
            } else if (pending.type === 'shield') {
                setStep('swapping');
                addMsg(`⏳ Executing ${pending.action}... Please confirm in your wallet.`);
                const asset = getAsset(pending.token);
                if (asset?.contractAddress) {
                    executeShield({
                        address: SHIELD_CONTRACT_ADDRESS as `0x${string}`,
                        abi: SHIELD_ABI,
                        functionName: pending.action,
                        args: [
                            asset.contractAddress as `0x${string}`,
                            parseUnits(pending.amount.toString(), 18),
                        ],
                    });
                }
            }
        }
    };

    // ── Send message handler ──
    const handleSend = async () => {
        const msg = input.trim();
        if (!msg) return;

        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        setInput('');
        setIsLoading(true);

        if (!isConnected) {
            addMsg('⚠️ Please connect your wallet first!');
            setIsLoading(false);
            return;
        }

        try {
            const result: ParseResult = await parseSwapIntent(msg);

            if (result.success) {
                if (result.type === 'portfolio') {
                    const tokenList = FLUX_ASSETS.map(a => `• ${a.symbol} (${a.name})`).join('\n');
                    addMsg(
                        `📊 **Your Portfolio**\n\nConnected: ${address?.slice(0, 6)}...${address?.slice(-4)}\n\nTracked tokens:\n${tokenList}\n\n💡 Go to the Portfolio tab for detailed balances and history.`
                    );
                } else if (result.type === 'shield' && result.shieldIntent) {
                    const { action, token, amount } = result.shieldIntent;
                    const icon = action === 'shield' ? '🔐' : '🔓';
                    setPending({ type: 'shield', action, token, amount });
                    addMsg(
                        `${icon} **${action.toUpperCase()} Preview** (parsed via ${result.source})\n\n` +
                        `• **Action**: ${action === 'shield' ? 'Shield (Encrypt)' : 'Unshield (Decrypt)'}\n` +
                        `• **Token**: ${amount} ${token}\n` +
                        (action === 'shield' ? `• **Receive**: ${amount} c${token}\n` : `• **Receive**: ${amount} ${token}\n`) +
                        `\nReady to execute?`,
                        { showConfirm: true },
                    );
                } else if (result.type === 'swap' && result.intent) {
                    const { amount, from, to } = result.intent;

                    if (!isPairAllowed(from, to)) {
                        addMsg(`⚠️ Pair ${from}/${to} is not available.\n\nAvailable tokens: ${FLUX_ASSETS.map(a => a.symbol).join(', ')}`);
                        setIsLoading(false);
                        return;
                    }

                    setPending({ type: 'swap', intent: result.intent });
                    addMsg(
                        `📋 **Swap Preview** (parsed via ${result.source})\n\n` +
                        `• **From**: ${amount} ${from}\n` +
                        `• **To**: ${to}\n` +
                        `• **Router**: AMM (SimpleAMM)\n\n` +
                        `Ready to execute?`,
                        { intent: result.intent, showConfirm: true },
                    );
                }
            } else {
                addMsg(`🤔 I couldn't understand that. Try:\n• "swap 10 USDO to GOLD"\n• "shield 5 USDO"\n• "unshield 3 USDO"\n• "cek portfolio"\n\n_Error: ${result.error}_`);
            }
        } catch (err: any) {
            addMsg(`❌ Error: ${err.message}`);
        }

        setIsLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const isProcessing = step === 'approving' || step === 'swapping';

    return (
        <>
            {/* Floating Button */}
            <motion.button
                onClick={() => { setIsOpen(!isOpen); setTimeout(() => inputRef.current?.focus(), 100); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                    position: 'fixed', bottom: '30px', right: '30px',
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(0,240,255,0.3), rgba(138,43,226,0.3))',
                    border: '2px solid var(--neon-cyan)', color: 'white', fontSize: '1.5rem',
                    cursor: 'pointer', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 25px rgba(0,240,255,0.4)', backdropFilter: 'blur(10px)',
                }}
            >
                {isOpen ? '✕' : '🤖'}
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed', bottom: '100px', right: '30px',
                            width: '380px', maxHeight: '500px',
                            background: 'rgba(10, 10, 20, 0.95)',
                            border: '1px solid rgba(0, 240, 255, 0.3)',
                            borderRadius: '16px', zIndex: 999,
                            display: 'flex', flexDirection: 'column', overflow: 'hidden',
                            boxShadow: '0 0 40px rgba(0,240,255,0.15), 0 20px 60px rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '15px 20px',
                            borderBottom: '1px solid rgba(0,240,255,0.2)',
                            display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>🤖</span>
                            <div>
                                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--neon-cyan)' }}>
                                    AI TRADING AGENT
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                    Swap · Shield · Portfolio
                                </div>
                            </div>
                            <div style={{
                                marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%',
                                background: isConnected ? '#00FF88' : '#FF4444',
                                boxShadow: isConnected ? '0 0 8px #00FF88' : '0 0 8px #FF4444',
                            }} />
                        </div>

                        {/* Messages */}
                        <div className="agent-chat-messages" style={{
                            flex: 1, overflowY: 'auto', padding: '15px',
                            display: 'flex', flexDirection: 'column', gap: '12px',
                            maxHeight: '340px', scrollbarWidth: 'none',
                        }}>
                            {messages.map((msg, i) => (
                                <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                    <div style={{
                                        background: msg.role === 'user' ? 'rgba(0,240,255,0.15)' : 'rgba(138,43,226,0.1)',
                                        border: `1px solid ${msg.role === 'user' ? 'rgba(0,240,255,0.3)' : 'rgba(138,43,226,0.2)'}`,
                                        borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                        padding: '10px 14px', fontSize: '0.85rem',
                                        color: 'rgba(255,255,255,0.9)', lineHeight: '1.5', whiteSpace: 'pre-wrap',
                                    }}>
                                        {msg.content}
                                        {msg.txHash && (
                                            <div style={{ marginTop: '8px' }}>
                                                <a href={`https://sepolia.basescan.org/tx/${msg.txHash}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    style={{ color: 'var(--neon-cyan)', textDecoration: 'underline', fontSize: '0.8rem' }}>
                                                    🔗 View on BaseScan
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirm / Cancel buttons */}
                                    {msg.showConfirm && pending && !isProcessing && step === 'idle' && (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <button onClick={handleConfirm}
                                                style={{
                                                    flex: 1, padding: '8px 12px',
                                                    background: 'rgba(0,255,136,0.15)', border: '1px solid #00FF88',
                                                    borderRadius: '8px', color: '#00FF88', cursor: 'pointer',
                                                    fontFamily: 'JetBrains Mono', fontSize: '0.8rem', fontWeight: 'bold',
                                                }}>
                                                ✓ CONFIRM
                                            </button>
                                            <button onClick={() => {
                                                setPending(null);
                                                addMsg('❌ Cancelled. What else would you like to do?');
                                            }}
                                                style={{
                                                    flex: 1, padding: '8px 12px',
                                                    background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.4)',
                                                    borderRadius: '8px', color: '#FF4444', cursor: 'pointer',
                                                    fontFamily: 'JetBrains Mono', fontSize: '0.8rem',
                                                }}>
                                                ✕ CANCEL
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div style={{
                                    alignSelf: 'flex-start',
                                    background: 'rgba(138,43,226,0.1)', border: '1px solid rgba(138,43,226,0.2)',
                                    borderRadius: '12px 12px 12px 4px', padding: '10px 14px',
                                    color: 'var(--neon-purple)', fontSize: '0.85rem',
                                }}>
                                    ⏳ Parsing...
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div style={{
                            padding: '12px 15px', borderTop: '1px solid rgba(0,240,255,0.2)',
                            display: 'flex', gap: '10px',
                        }}>
                            <input ref={inputRef} type="text" value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder='swap, shield, portfolio...'
                                disabled={isLoading || isProcessing}
                                style={{
                                    flex: 1, background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                    padding: '10px 14px', color: 'white', fontSize: '0.85rem',
                                    fontFamily: 'JetBrains Mono', outline: 'none',
                                }}
                            />
                            <button onClick={handleSend}
                                disabled={isLoading || isProcessing || !input.trim()}
                                style={{
                                    background: 'rgba(0,240,255,0.15)', border: '1px solid var(--neon-cyan)',
                                    borderRadius: '8px', padding: '10px 14px', color: 'var(--neon-cyan)',
                                    cursor: 'pointer', fontSize: '1rem',
                                    opacity: isLoading || !input.trim() ? 0.5 : 1,
                                }}>
                                →
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SwapAgent;
