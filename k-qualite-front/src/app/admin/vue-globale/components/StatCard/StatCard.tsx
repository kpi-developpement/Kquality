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
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconBox} style={{ background: colorBg, color: colorIcon }}>
          {icon}
        </div>
        {trend && (
          <div className={`${styles.trend} ${trendType === 'positive' ? styles.trendPositive : styles.trendNeutral}`}>
            {trend}
          </div>
        )}
      </div>
      <div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.value}>{value}</p>
      </div>
    </div>
  );
}