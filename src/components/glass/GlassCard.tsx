import React from 'react';
import styles from './Glassmorphism.module.css';

interface GlassCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({ title, description, icon }) => {
  return (
    <div className={`${styles.glassContainer} ${styles.card}`}>
      <div className="mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-white/70 leading-relaxed">
        {description}
      </p>
      <div className="mt-6">
        <a href="#" className="text-sm font-semibold inline-flex items-center group" style={{ color: 'var(--stride-red)' }}>
          Read more
          <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
        </a>
      </div>
    </div>
  );
};

export default GlassCard;
