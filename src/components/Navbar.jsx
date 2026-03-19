import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Navbar = () => {
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      width: '100%',
      padding: '15px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 100,
      background: 'rgba(2, 2, 10, 0.9)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(0, 240, 255, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <img 
          src="/Logo + Wordmark 1.jpg" 
          alt="Rialo Obscura" 
          style={{ height: '40px', objectFit: 'contain' }} 
        />
        <div className="nav-links" style={{ display: 'flex', gap: '10px' }}>
          <a href="https://www.rialo.io/#home" className="nav-link">HOME</a>
          <a href="https://www.rialo.io/docs" className="nav-link">DOCS</a>
          <a href="https://www.rialo.io/blog" className="nav-link">BLOG</a>
          <a href="http://learn.rialo.io/" className="nav-link">LEARN</a>
          <a href="https://www.rialo.io/news" className="nav-link">NEWS</a>
        </div>
      </div>
      <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
    </nav>
  );
};

export default Navbar;