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
        : undefined; 

    const {
        needsApproval,
        handleApprove,
        isApprovalConfirmed,
        approveError,
    } = useTokenApproval(approvalTokenAddress, approvalAmount, approvalSpender);

    
    const {
        writeContract: executeSwap,
        data: swapTxHash,
        error: swapWriteError,
    } = useWriteContract();

    const { isSuccess: isSwapConfirmed } = useWaitForTransactionReceipt({ hash: swapTxHash });

    
    const {
        writeContract: executeShield,
        data: shieldTxHash,
        error: shieldWriteError,
    } = useWriteContract();

    const { isSuccess: isShieldConfirmed } = useWaitForTransactionReceipt({ hash: shieldTxHash });

    
    const addMsg = (content: string, extra?: Partial<ChatMessage>) => {
        setMessages(prev => [...prev, { role: 'agent', content, ...extra }]);
    };

    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    
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

    
    useEffect(() => {
        if (approveError && step === 'approving') {
            addMsg('❌ Approval rejected or failed. You can try again!');
            setStep('idle');
        }
    }, [approveError]);

    
    useEffect(() => {
        if (swapWriteError && step === 'swapping') {
            addMsg('❌ Swap rejected or failed. You can try again!');
            setStep('idle');
        }
    }, [swapWriteError]);

    
    useEffect(() => {
        if (shieldWriteError && step === 'swapping') {
            addMsg('❌ Transaction rejected or failed. You can try again!');
            setStep('idle');
        }
    }, [shieldWriteError]);

    
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

    
    const handleConfirm = () => {
        if (!pending) return;

        if (needsApproval) {
            
            setStep('approving');
            const tokenName = pending.type === 'swap' ? pending.intent.from : pending.token;
            addMsg(`⏳ Approving ${tokenName}... Please confirm in your wallet.`);
            handleApprove();
        } else {
            
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
            {}
            <motion.button
                onClick={() => { setIsOpen(!isOpen); setTimeout(() => inputRef.current?.focus(), 100); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                    position: 'fixed', bottom: '30px', right: '30px',
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'rgba(61,158,78,0.15)',
                    border: '2px solid var(--green-600)', color: 'white', fontSize: '1.4rem',
                    cursor: 'pointer', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(61,158,78,0.3)', backdropFilter: 'blur(10px)',
                }}
            >
                {isOpen ? '✕' : '🤖'}
            </motion.button>

            {}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed', bottom: '100px', right: '30px',
                            width: '360px', maxHeight: '480px',
                            background: 'rgba(10,10,15,0.97)',
                            border: '1px solid rgba(61,158,78,0.2)',
                            borderRadius: '16px', zIndex: 999,
                            display: 'flex', flexDirection: 'column', overflow: 'hidden',
                            boxShadow: '0 0 30px rgba(61,158,78,0.1), 0 20px 60px rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        {}
                        <div style={{
                            padding: '14px 18px',
                            borderBottom: '1px solid rgba(61,158,78,0.12)',
                            display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>🤖</span>
                            <div>
                                <div style={{ fontFamily: 'Inter, system-ui', fontSize: '0.85rem', fontWeight: 700, color: 'var(--green-300)' }}>
                                    AI TRADING AGENT
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                    Swap  Shield  Portfolio
                                </div>
                            </div>
                            <div style={{
                                marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%',
                                background: isConnected ? 'var(--green-400)' : '#FF4444',
                                boxShadow: isConnected ? '0 0 6px var(--green-400)' : '0 0 6px #FF4444',
                            }} />
                        </div>

                        {}
                        <div className="agent-chat-messages" style={{
                            flex: 1, overflowY: 'auto', padding: '15px',
                            display: 'flex', flexDirection: 'column', gap: '12px',
                            maxHeight: '340px', scrollbarWidth: 'none',
                        }}>
                            {messages.map((msg, i) => (
                                <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                    <div style={{
                                        background: msg.role === 'user' ? 'rgba(61,158,78,0.1)' : 'rgba(157,78,221,0.08)',
                                        border: `1px solid ${msg.role === 'user' ? 'rgba(61,158,78,0.25)' : 'rgba(157,78,221,0.15)'}`,
                                        borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                        padding: '10px 14px', fontSize: '0.85rem',
                                        color: 'rgba(255,255,255,0.9)', lineHeight: '1.5', whiteSpace: 'pre-wrap',
                                    }}>
                                        {msg.content}
                                        {msg.txHash && (
                                            <div style={{ marginTop: '8px' }}>
                                                <a href={`https://sepolia.basescan.org/tx/${msg.txHash}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    style={{ color: 'var(--green-400)', textDecoration: 'underline', fontSize: '0.78rem' }}>
                                                    🔗 View on BaseScan
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {}
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

                        {}
                        <div style={{
                            padding: '11px 15px', borderTop: '1px solid rgba(61,158,78,0.12)',
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
                                    background: 'rgba(61,158,78,0.1)', border: '1px solid var(--green-600)',
                                    borderRadius: '8px', padding: '9px 14px', color: 'var(--green-300)',
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
