import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="obscura-footer">
      <div className="footer-grid">

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <img src="/assets/2.png" alt="Obscura Logo" style={{ height: '20px', width: 'auto', objectFit: 'contain' }} />
            <span style={{ fontFamily: "'MADE Future X Header', sans-serif", fontSize: '0.9rem', color: 'var(--green-400)', letterSpacing: '1px' }}>OBSCURA</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: '1.75', maxWidth: 280 }}>
          Privacy first DeFi protocol with AI powered trading, hybrid AMM and RFQ routing, encrypted vaults, and dark pool liquidity. Built on Base.
          </p>
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <a href="https://discord.com/invite/RialoProtocol" target="_blank" rel="noopener noreferrer" className="footer-social-link" title="Discord">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.081.118 18.104.14 18.118a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
            </a>
            <a href="https://x.com/RialoHQ" target="_blank" rel="noopener noreferrer" className="footer-social-link" title="X (Twitter)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://t.me/rialoprotocol" target="_blank" rel="noopener noreferrer" className="footer-social-link" title="Telegram">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
          </div>
        </div>

        <div>
          <div className="footer-col-title">Protocol</div>
          <a href="/app?tab=swap" className="footer-link">Swap</a>
          <a href="/app?tab=liquidity" className="footer-link">Liquidity Pools</a>
          <a href="/app?tab=shield" className="footer-link">Vault</a>
          <a href="/app?tab=markets" className="footer-link">Markets</a>
          <a href="/docs" className="footer-link">Documentation</a>
        </div>

        <div>
          <div className="footer-col-title">Community</div>
          <a href="https://discord.com/invite/RialoProtocol" target="_blank" rel="noopener noreferrer" className="footer-link">Discord</a>
          <a href="https://x.com/RialoHQ" target="_blank" rel="noopener noreferrer" className="footer-link">Twitter</a>
          <a href="https://t.me/rialoprotocol" target="_blank" rel="noopener noreferrer" className="footer-link">Telegram</a>
          <a href="https://www.rialo.io/blog" target="_blank" rel="noopener noreferrer" className="footer-link">Blog</a>
          <a href="http://learn.rialo.io/" target="_blank" rel="noopener noreferrer" className="footer-link">Learn</a>
        </div>

        <div>
          <div className="footer-col-title">Legal</div>
          <a href="https://www.rialo.io/privacy-policy" target="_blank" rel="noopener noreferrer" className="footer-link">Privacy Policy</a>
          <a href="https://www.rialo.io/terms-of-service" target="_blank" rel="noopener noreferrer" className="footer-link">Terms of Use</a>
          <a href="https://www.rialo.io/brand-assets" target="_blank" rel="noopener noreferrer" className="footer-link">Brand Assets</a>
        </div>

      </div>

      <div className="footer-bottom">
        <div>
          <span>2026. Created by </span>
          <a href="https://x.com/cryptocymol" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green-400)', fontWeight: 600 }}>Vika Joestar</a>
          <span> and </span>
          <a href="https://x.com/0xskypots" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green-400)', fontWeight: 600 }}>Skypots</a>
        </div>
        <div>
          <span style={{ marginRight: 6 }}>Backed by</span>
          <a
            href="https://x.com/BantolDao"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--green-300)', fontWeight: 700 }}
          >
            BantolDAO
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
