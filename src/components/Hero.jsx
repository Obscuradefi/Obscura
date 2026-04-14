import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const Hero = ({ onEnter, isBackground = false }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles = [];
    const particleCount = 100; 
    const connectionDistance = 150;
    const mouse = { x: null, y: null };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 2;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }
      draw() {
        ctx.fillStyle = '#00F0FF';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) particles.push(new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
        particles.forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            ctx.strokeStyle = `rgba(0, 240, 255, ${1 - dist / connectionDistance})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
        if (mouse.x) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 250) {
            ctx.strokeStyle = `rgba(138, 43, 226, ${1 - dist / 250})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    };

    animate();
    const handleResize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; };
    const handleMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    return () => { window.removeEventListener('resize', handleResize); window.removeEventListener('mousemove', handleMouseMove); };
  }, []);

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }} />
      
      {}
      {!isBackground && (
        <div style={{
          position: 'relative',
          zIndex: 10,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0 20px',
          background: 'radial-gradient(circle, rgba(2,2,10,0) 0%, rgba(2,2,10,0.8) 100%)' 
        }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
            <img 
              src="/Logo 2.jpg" 
              alt="Rialo Icon" 
              style={{ 
                width: '100px', 
                marginBottom: '30px', 
                borderRadius: '50%', 
                border: '2px solid var(--neon-cyan)',
                boxShadow: '0 0 30px rgba(0, 240, 255, 0.2)'
              }} 
            />
            <h1 className="glow-text" style={{ fontSize: '5rem', marginBottom: '15px', letterSpacing: '2px', lineHeight: '1', fontFamily: 'Rajdhani' }}>
              RIALO OBSCURA
            </h1>
            <p style={{ color: 'var(--text-dim)', marginBottom: '50px', maxWidth: '700px', fontSize: '1.2rem', lineHeight: '1.6' }}>
              THE SHADOW LAYER FOR BASE SEPOLIA. <br/>
              ADVANCED ASSET SHIELDING AND PRIVACY PROTOCOL.
            </p>
            <div style={{ transform: 'scale(1.1)' }}>
              <button className="btn-primary" onClick={onEnter}>
                INITIALIZE SYSTEM
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Hero;
