import React, { useState } from 'react';
import { motion } from 'framer-motion';

const levels = [
  { id: 1, title: 'LEVEL 01: ZERO TRACE', desc: 'Implementing privacy layers.' },
  { id: 2, title: 'LEVEL 02: SHADOW REALM', desc: 'Encrypted transaction routing.' },
  { id: 3, title: 'LEVEL 03: GHOST PROTOCOL', desc: 'Complete on-chain silence.' },
];

const CaseStudies = () => {
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ padding: '50px', background: 'var(--void)' }}>
      <h3 style={{ color: 'var(--text-dim)', marginBottom: '30px', fontFamily: 'JetBrains Mono' }}>
        // MISSION ARCHIVE
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {levels.map((level) => (
          <motion.div
            key={level.id}
            onClick={() => setExpanded(level.id === expanded ? null : level.id)}
            className="cyber-card"
            style={{ 
              padding: '20px', 
              cursor: 'pointer',
              borderColor: expanded === level.id ? 'var(--neon-purple)' : 'var(--glass-border)'
            }}
            whileHover={{ scale: 1.02 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '1.5rem', color: expanded === level.id ? 'var(--neon-purple)' : 'white' }}>
                  {level.title}
                </h4>
                <p style={{ color: 'var(--text-dim)' }}>{level.desc}</p>
              </div>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '50%', 
                border: '1px solid var(--neon-cyan)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: expanded === level.id ? 'var(--neon-cyan)' : 'transparent',
                color: expanded === level.id ? 'black' : 'var(--neon-cyan)'
              }}>
                {expanded === level.id ? 'UNLK' : 'LCKD'}
              </div>
            </div>

            {expanded === level.id && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ marginTop: '20px' }}
              >
                <div style={{ width: '100%', height: '4px', background: '#333', marginBottom: '15px' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1 }}
                    style={{ height: '100%', background: 'var(--neon-purple)' }}
                  />
                </div>
                <div style={{ 
                  height: '200px', 
                  background: 'rgba(0,0,0,0.5)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px dashed var(--text-dim)'
                }}>
                  <p className="glow-text">DATA DECRYPTED: VIDEO PLACEHOLDER</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CaseStudies;