import React from 'react';

const Stats = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
      <div className="cyber-card" style={{ padding: '20px', textAlign: 'center' }}>
        <h4 style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '5px' }}>TOTAL VALUE SHIELDED</h4>
        <p className="glow-text" style={{ fontSize: '2rem', fontFamily: 'JetBrains Mono' }}>$4,291,000</p>
      </div>
      <div className="cyber-card" style={{ padding: '20px', textAlign: 'center' }}>
        <h4 style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '5px' }}>ANONYMITY SET</h4>
        <p style={{ fontSize: '2rem', fontFamily: 'JetBrains Mono', color: 'var(--neon-cyan)' }}>12,842</p>
      </div>
      <div className="cyber-card" style={{ padding: '20px', textAlign: 'center' }}>
        <h4 style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '5px' }}>PROTOCOL STATUS</h4>
        <p style={{ fontSize: '2rem', fontFamily: 'JetBrains Mono', color: '#00FF00' }}>ONLINE</p>
      </div>
    </div>
  );
};

export default Stats;
