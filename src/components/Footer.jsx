import React from 'react';

const Footer = () => {
  return (
    <footer style={{ borderTop: '1px solid rgba(0, 240, 255, 0.1)', background: 'rgba(2, 2, 10, 0.95)', padding: '80px 20px 30px', marginTop: '80px', position: 'relative', zIndex: 10 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '40px' }}>

        <div>
          <img
            src="/Logo + Wordmark 1.jpg"
            alt="Rialo Obscura"
            style={{ height: '35px', marginBottom: '25px', opacity: 0.9, borderRadius: '4px' }}
          />
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: '1.8', maxWidth: '300px' }}>
            Rialo Obscura is the premier privacy layer for Base Sepolia, enabling shielded transactions and encrypted asset management through advanced cryptographic protocols.
          </p>
        </div>

        <div>
          <h4 style={{ color: 'white', marginBottom: '25px', fontFamily: 'JetBrains Mono', fontSize: '1.1rem' }}>QUICK LINKS</h4>
          <a href="https://www.rialo.io/#home" className="footer-link">HOME</a>
          <a href="https://www.rialo.io/docs" className="footer-link">DOCS</a>
          <a href="https://www.rialo.io/blog" className="footer-link">BLOG</a>
          <a href="http://learn.rialo.io/" className="footer-link">LEARN</a>
          <a href="https://www.rialo.io/news" className="footer-link">NEWS</a>
        </div>

        <div>
          <h4 style={{ color: 'white', marginBottom: '25px', fontFamily: 'JetBrains Mono', fontSize: '1.1rem' }}>ABOUT RIALO</h4>
          <a href="https://discord.com/invite/RialoProtocol" className="footer-link">DISCORD</a>
          <a href="https://x.com/RialoHQ" className="footer-link">TWITTER</a>
          <a href="https://t.me/rialoprotocol" className="footer-link">TELEGRAM</a>
        </div>

        <div>
          <h4 style={{ color: 'white', marginBottom: '25px', fontFamily: 'JetBrains Mono', fontSize: '1.1rem' }}>SYSTEM</h4>
          <a href="https://www.rialo.io/privacy-policy" className="footer-link">PRIVACY POLICY</a>
          <a href="https://www.rialo.io/terms-of-service" className="footer-link">TERMS OF USE</a>
          <a href="https://www.rialo.io/brand-assets" className="footer-link">BRAND</a>
        </div>

      </div>

      <div style={{ textAlign: 'center', marginTop: '80px', paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ color: '#555', fontFamily: 'JetBrains Mono', fontSize: '0.8rem', marginBottom: '20px' }}>
          2026. CREATED BY VIKA JOESTAR & SKYPOTS
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
          {/* Vika Joestar Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>VIKA JOESTAR:</span>
            <a
              href="https://x.com/cryptocymol"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--neon-cyan)',
                textDecoration: 'none',
                fontSize: '1.2rem',
                transition: 'transform 0.2s',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              title="X (Twitter)"
            >
              𝕏
            </a>
            <a
              href="https://github.com/cilokcimol"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--neon-cyan)',
                textDecoration: 'none',
                fontSize: '1.2rem',
                transition: 'transform 0.2s',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              title="GitHub"
            >
              ⚡
            </a>
          </div>

          {/* Skypots Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontFamily: 'JetBrains Mono' }}>SKYPOTS:</span>
            <a
              href="https://x.com/0xskypots"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--neon-purple)',
                textDecoration: 'none',
                fontSize: '1.2rem',
                transition: 'transform 0.2s',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              title="X (Twitter)"
            >
              𝕏
            </a>
            <a
              href="https://github.com/taufnashrul04"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--neon-purple)',
                textDecoration: 'none',
                fontSize: '1.2rem',
                transition: 'transform 0.2s',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              title="GitHub"
            >
              ⚡
            </a>
          </div>
        </div>

        <div style={{ marginTop: '30px', fontFamily: 'JetBrains Mono', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-dim)', marginRight: '8px' }}>BACKED BY:</span>
          <a
            href="https://x.com/BantolDao"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--neon-green)',
              textDecoration: 'none',
              fontWeight: 'bold',
              letterSpacing: '1px'
            }}
          >
            BANTOLDAO
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;