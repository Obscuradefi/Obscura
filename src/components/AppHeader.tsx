import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface AppHeaderProps {
    onFaucetClick?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onFaucetClick }) => {
    const navigate = useNavigate();
    return (
        <nav style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--glass)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid var(--glass-border)',
            padding: '16px 32px',
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                {/* Left: Branding */}
                <div
                    onClick={() => navigate('/')}
                    style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}
                >
                    <img
                        src="/Logo 2.jpg"
                        alt="Rialo"
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: '2px solid var(--neon-cyan)',
                        }}
                    />
                    <h2 style={{ 
                        fontSize: '1.4rem', 
                        fontFamily: 'Space Grotesk', 
                        fontWeight: 700, 
                        letterSpacing: '-0.02em',
                        background: 'linear-gradient(to right, #FFF, var(--text-dim))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        RIALO OBSCURA
                    </h2>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-dim)',
                        fontFamily: 'Roboto Mono',
                        fontWeight: 500,
                        padding: '6px 12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--glass-border)',
                    }}>
                        BASE SEPOLIA
                    </div>

                    {onFaucetClick && (
                        <button
                            className="btn-primary"
                            onClick={onFaucetClick}
                            style={{ fontSize: '0.85rem', padding: '8px 20px' }}
                        >
                            FAUCET
                        </button>
                    )}

                    <ConnectButton />
                </div>
            </div>
        </nav>
    );
};

export default AppHeader;
