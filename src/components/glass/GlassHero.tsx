import React from 'react';
import styles from './Glassmorphism.module.css';

interface GlassHeroProps {
  title: string;
  subtitle: string;
}

const GlassHero: React.FC<GlassHeroProps> = ({ title, subtitle }) => {
  return (
    <section className={`${styles.glassContainer} ${styles.heroContainer}`}>
      {/* Background Blobs for depth */}
      <div className={styles.blob} style={{ top: '10%', left: '10%' }}></div>
      <div className={styles.blobSecondary} style={{ bottom: '10%', right: '10%' }}></div>
      <div className={styles.blob} style={{ top: '40%', right: '20%', background: 'var(--stride-blue)', width: '250px', height: '250px' }}></div>

      <div className={styles.heroPanel}>
        <div style={{ transform: 'translateZ(50px)' }}>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-2xl">
            {subtitle}
          </p>
          <div className="flex gap-4">
            <button className={styles.button} style={{ background: 'var(--stride-red)' }}>
              Get Started
              <div className={styles.shimmer}></div>
            </button>
            <button className={styles.button}>
              Learn More
              <div className={styles.shimmer}></div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlassHero;
