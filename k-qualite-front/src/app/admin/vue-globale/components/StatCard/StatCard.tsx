import React from 'react';
import styles from './StatCard.module.css';

interface Props { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  colorBg: string; 
  colorIcon: string; 
  trend?: string; 
  trendType?: 'positive' | 'neutral'; 
}

export default function StatCard({ title, value, icon, colorBg, colorIcon, trend, trendType = 'neutral' }: Props) {
  return (
    <div className={styles.cardContent}>
      <div className={styles.header}>
        {/* L'iconBox db fiha wa7d l'Glow */}
        <div className={styles.iconBox} style={{ background: colorBg, color: colorIcon, boxShadow: `0 8px 20px ${colorBg}` }}>
          <div className={styles.iconInner}>{icon}</div>
        </div>
        {trend && <div className={`${styles.trend} ${trendType === 'positive' ? styles.trendPositive : styles.trendNeutral}`}>{trend}</div>}
      </div>
      <div className={styles.textArea}>
        <h3 className={styles.title}>{title}</h3>
        {/* L'Montant b Gradient Text */}
        <p className={styles.value}>{value}</p>
      </div>
    </div>
  );
}