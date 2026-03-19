import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { addActivity } from '../../lib/fluxMock';

const RIALO_USDC_ADDRESS = '0x191798C747807ae164f2a28fA5DFb5145AcE4b6B';

const MINT_ABI = [
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

import { SHIELD_CONTRACT_ADDRESS, SHIELD_ABI } from '../../config/shieldConfig';
import { ERC20_ABI } from '../../config/dexConfig';

const ShieldTab = () => {
    const { address, isConnected } = useAccount();
    const [shieldAmount, setShieldAmount] = useState('');
    const [unshieldAmount, setUnshieldAmount] = useState('');

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

    const handleShield = () => {
        if (!shieldAmount || isNaN(Number(shieldAmount))) return;
        try {
            const amount = parseUnits(shieldAmount, 18);
            writeContract({
                address: RIALO_USDC_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [SHIELD_CONTRACT_ADDRESS, amount]
            });
        } catch (err: any) {
            console.error("Crash in handleShield:", err);
            alert("Error: " + err.message);
        }
    };

    const executeShield = () => {
        if (!shieldAmount || isNaN(Number(shieldAmount))) return;
        writeContract({
            address: SHIELD_CONTRACT_ADDRESS,
            abi: SHIELD_ABI,
            functionName: 'shield',
            args: [RIALO_USDC_ADDRESS, parseUnits(shieldAmount, 18)]
        }, {
            onSuccess: () => {
                addActivity({ type: 'shield', description: `Shielded ${shieldAmount} USDO` });
                setShieldAmount('');
            }
        });
    }

    const handleUnshield = () => {
        if (!unshieldAmount || isNaN(Number(unshieldAmount))) return;
        writeContract({
            address: SHIELD_CONTRACT_ADDRESS,
            abi: SHIELD_ABI,
            functionName: 'unshield',
            args: [RIALO_USDC_ADDRESS, parseUnits(unshieldAmount, 18)]
        }, {
            onSuccess: () => {
                addActivity({ type: 'unshield', description: `Unshielded ${unshieldAmount} USDO` });
                setUnshieldAmount('');
            }
        });
    };

    const setMaxShield = () => {
        if (formattedBalance) setShieldAmount(formattedBalance);
    };

    const setMaxUnshield = () => {
        if (encryptedBalanceVal) setUnshieldAmount(encryptedBalanceVal.toString());
    };

    if (isConfirmed) {
        refetchPublic();
        refetchPrivate();
    }

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
                        A SECURE CONNECTION IS REQUIRED TO ACCESS THE SHIELD PROTOCOL.
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
            style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px 60px', display: 'flex', flexDirection: 'column', gap: '30px' }}
        >
            <h2 className="glow-text" style={{ fontSize: '2.5rem', marginBottom: '5px' }}>
                SHIELD
            </h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '20px', fontFamily: 'JetBrains Mono', fontSize: '0.9rem' }}>
                // PRIVACY OPERATIONS PROTOCOL
            </p>

            {/* Total Unshielded Balance Hero */}
            <div className="glass-panel" style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>
                <h1 className="mono" style={{ fontSize: '3.5rem', margin: '0 0 10px 0', lineHeight: 1, color: 'white', textShadow: '0 0 20px rgba(255,255,255,0.3)', wordBreak: 'break-all' }}>
                    ${formattedBalance === '0' ? '0.00' : formattedBalance}
                </h1>
                <p style={{ color: 'var(--text-dim)', fontFamily: 'JetBrains Mono', fontSize: '0.9rem', margin: 0 }}>
                    // TOTAL UNSHIELDED BALANCE
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '30px', marginTop: '10px' }}>
                {/* Left Card: PUBLIC WALLET */}
                <div className="glass-panel" style={{ padding: '30px', border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                    <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '30px', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>PUBLIC WALLET</h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
                        <div style={{ width: '48px', height: '48px', background: '#2775CA', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.4rem', color: 'white' }}>$</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '1.2rem', color: 'white' }}>USDO</div>
                            <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Base Sepolia</div>
                        </div>
                        <div className="mono" style={{ fontSize: '1.1rem', color: 'white', textAlign: 'right', wordBreak: 'break-all', maxWidth: '40%' }}>
                            {formattedBalance}
                        </div>
                    </div>
                    
                    <div className="input-wrapper" style={{ marginBottom: '20px' }}>
                        <input type="text" className="cyber-input mono" placeholder="0.00" value={shieldAmount} onChange={(e) => setShieldAmount(e.target.value)} />
                        <button className="btn-max" onClick={setMaxShield}>MAX</button>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button className="btn-approve" style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 600, letterSpacing: '1px' }} onClick={handleShield}>
                            1. APPROVE
                        </button>
                        <button className="btn-swap" style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 600, letterSpacing: '1px', background: 'transparent', color: 'var(--neon-cyan)', border: '1px solid var(--neon-cyan)' }} onClick={executeShield}>
                            2. SHIELD &gt;&gt;
                        </button>
                    </div>
                </div>

                {/* Right Card: ENCRYPTED VAULT */}
                <div className="glass-panel" style={{ padding: '30px', border: '1px solid rgba(157, 78, 221, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <h3 style={{ color: 'var(--neon-purple)', margin: 0, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>ENCRYPTED VAULT</h3>
                        <button onClick={() => setShowEncrypted(!showEncrypted)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-dim)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'JetBrains Mono', transition: 'all 0.2s' }}>
                            VIEW BALANCE
                        </button>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
                        <div style={{ width: '48px', height: '48px', background: 'var(--neon-purple)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.4rem', color: 'white' }}>🔒</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '1.2rem', color: 'white' }}>cUSDO</div>
                            <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Rialo Privacy Layer</div>
                        </div>
                        <div className="mono" style={{ fontSize: '1.4rem', color: 'var(--neon-purple)', textAlign: 'right', letterSpacing: showEncrypted ? '0' : '4px' }}>
                            {showEncrypted ? encryptedBalanceVal.toFixed(2) : '******'}
                        </div>
                    </div>
                    
                    <div className="input-wrapper" style={{ marginBottom: '20px' }}>
                        <input type="text" className="cyber-input mono" style={{ borderColor: 'rgba(157, 78, 221, 0.5)' }} placeholder="0.00" value={unshieldAmount} onChange={(e) => setUnshieldAmount(e.target.value)} />
                        <button className="btn-max" onClick={setMaxUnshield} style={{ color: 'var(--neon-purple)', borderColor: 'var(--neon-purple)' }}>MAX</button>
                    </div>
                    <button className="btn-swap" style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 600, letterSpacing: '1px', background: 'transparent', color: 'var(--neon-purple)', border: '1px solid var(--neon-purple)' }} onClick={handleUnshield}>
                        &lt;&lt; UNSHIELD ASSETS
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ShieldTab;
