import React from 'react';
import styles from './Glassmorphism.module.css';

const GlassNavbar = () => {
  return (
    <nav className={`${styles.glassContainer} ${styles.navbar}`}>
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="text-2xl font-bold tracking-tighter decoration-0">
          <span style={{ color: 'var(--stride-red)' }}>Stride</span>
          <span className="text-white">Glass</span>
        </a>
        <div className="hidden md:flex space-x-8">
          <a href="#" className="text-sm font-medium hover:text-white transition-colors decoration-0">Hero</a>
          <a href="#" className="text-sm font-medium hover:text-white transition-colors decoration-0">Features</a>
          <a href="#" className="text-sm font-medium hover:text-white transition-colors decoration-0">Pricing</a>
        </div>
        <div>
          <a href="#" className={styles.button}>
            Connect Wallet
            <div className={styles.shimmer}></div>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default GlassNavbar;
