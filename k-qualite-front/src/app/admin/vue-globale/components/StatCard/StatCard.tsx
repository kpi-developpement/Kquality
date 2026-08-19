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
        {/* L'iconBox mriguel bl couleurs */}
        <div className={styles.iconBox} style={{ background: colorBg }}>
          {/* L'icone f westo m3a l'couleur exacte */}
          <div className={styles.iconInner} style={{ color: colorIcon }}>
            {icon}
          </div>
        </div>
        {trend && <div className={`${styles.trend} ${trendType === 'positive' ? styles.trendPositive : styles.trendNeutral}`}>{trend}</div>}
      </div>
      <div className={styles.textArea}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.value}>{value}</p>
      </div>
    </div>
  );
}