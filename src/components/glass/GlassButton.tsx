import React from 'react';
import styles from './Glassmorphism.module.css';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass';
  children: React.ReactNode;
}

const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'glass',
  children,
  className = '',
  style,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { background: 'var(--stride-red)', border: 'none' };
      case 'secondary':
        return { background: 'var(--stride-blue)', border: 'none' };
      default:
        return {};
    }
  };

  return (
    <button
      className={`${styles.glassContainer} ${styles.button} ${className}`}
      style={{ ...getVariantStyle(), ...style }}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div className={styles.shimmer}></div>
    </button>
  );
};

export default GlassButton;
