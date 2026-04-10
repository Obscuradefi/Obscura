import React from 'react';
import { motion } from 'framer-motion';

const StakeTab = () => {
    const vaults = [
        {
            name: 'USDO Vault',
            description: 'Stake USDO for yield generation',
            icon: '💰',
        },
        {
            name: 'Shielded USDO Vault',
            description: 'Private staking with enhanced privacy',
            icon: '🔒',
        },
    ];

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 className="glow-text" style={{ fontSize: '2.5rem', marginBottom: '15px' }}>
                STAKE
            </h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '40px', fontFamily: 'JetBrains Mono', fontSize: '0.9rem' }}>
        // YIELD VAULTS - COMING SOON
            </p>

            <div style={{
                padding: '30px',
                background: 'rgba(138, 43, 226, 0.05)',
                border: '1px dashed var(--neon-purple)',
                borderRadius: '20px',
                textAlign: 'center',
                marginBottom: '40px',
            }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>⏳</div>
                <h3 style={{ color: 'var(--neon-purple)', marginBottom: '10px', fontSize: '1.3rem' }}>
                    STAKING COMING SOON
                </h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                    Yield vaults will be available soon. Stay tuned.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {vaults.map((vault, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="cyber-card"
                        style={{
                            padding: '30px',
                            opacity: 0.6,
                            borderColor: 'rgba(138, 43, 226, 0.3)',
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>{vault.icon}</div>
                        <h3 style={{ color: 'var(--neon-purple)', marginBottom: '10px', fontSize: '1.2rem' }}>
                            {vault.name}
                        </h3>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '20px', fontSize: '0.85rem' }}>
                            {vault.description}
                        </p>

                        <div style={{
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '12px',
                            marginBottom: '15px',
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '5px' }}>APY</div>
                            <div style={{ fontSize: '1.5rem', fontFamily: 'JetBrains Mono', color: 'var(--neon-purple)' }}>
                                - - -
                            </div>
                        </div>

                        <button
                            className="btn-purple"
                            disabled
                            style={{
                                width: '100%',
                                opacity: 0.5,
                                cursor: 'not-allowed',
                            }}
                        >
                            COMING SOON
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default StakeTab;
