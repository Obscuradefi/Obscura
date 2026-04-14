import React from 'react';
import { motion } from 'framer-motion';

const Architecture = () => {
  return (
    <div style={{ padding: '60px 0', background: 'transparent' }}>
      <div className="cyber-card" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '40px', fontFamily: 'JetBrains Mono', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
          
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ border: '1px solid #2775CA', padding: '20px', borderRadius: '4px', marginBottom: '10px' }}>
              <h4 style={{ color: '#2775CA' }}>PUBLIC LAYER</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>USDC (ERC-20)</p>
            </div>
            <p style={{ fontSize: '0.8rem' }}>TRANSPARENT LEDGER</p>
          </div>

          <div style={{ color: 'var(--neon-cyan)', fontSize: '2rem' }}>→</div>

          <div style={{ textAlign: 'center', flex: 1 }}>
             <div style={{ 
               border: '1px solid var(--neon-purple)', 
               padding: '20px', 
               borderRadius: '4px', 
               marginBottom: '10px',
               background: 'rgba(138, 43, 226, 0.05)',
               boxShadow: '0 0 20px rgba(138, 43, 226, 0.2)'
             }}>
               <h4 className="glow-text" style={{ color: 'var(--neon-purple)' }}>RIALO OBSCURA</h4>
               <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>ENCRYPTED SHIELDING POOL</p>
               <div style={{ marginTop: '10px', fontSize: '1.5rem' }}>🔒</div>
             </div>
          </div>

          <div style={{ color: 'var(--neon-cyan)', fontSize: '2rem' }}>→</div>

          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ border: '1px solid var(--neon-purple)', padding: '20px', borderRadius: '4px', marginBottom: '10px' }}>
              <h4 style={{ color: 'var(--neon-purple)' }}>PRIVATE ASSET</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>cUSDC (SHIELDED)</p>
            </div>
            <p style={{ fontSize: '0.8rem' }}>UNTRACEABLE BALANCE</p>
          </div>

        </div>
        
        <div style={{ marginTop: '40px', color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: '1.6', fontFamily: 'JetBrains Mono' }}>
            &gt; RIALO OBSCURA utilizes advanced cryptographic proofs to decouple the link between the depositor and the recipient.<br/>
            &gt; All transactions within the Obscura layer are encrypted, ensuring total on-chain silence.
        </div>
      </div>
    </div>
  );
};

export default Architecture;
