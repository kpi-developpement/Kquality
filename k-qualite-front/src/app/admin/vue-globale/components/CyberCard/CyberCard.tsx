"use client";

import React, { useRef, useState } from 'react';
import styles from './CyberCard.module.css';

interface Props {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

export default function CyberCard({ title, value, icon, color, trend }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPosition({ x, y });

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    cardRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `rotateX(0deg) rotateY(0deg)`;
  };

  return (
    <div className={styles.cardWrapper}>
      <div 
        ref={cardRef}
        className={styles.card}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ 
          '--mouse-x': `${position.x}px`, 
          '--mouse-y': `${position.y}px`,
          '--glow-color': color
        } as React.CSSProperties}
      >
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.iconBox}>{icon}</div>
            {trend && <div className={styles.trend}>{trend}</div>}
          </div>
          <div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.value}>{value}</p>
          </div>
        </div>
      </div>
    </div>
  );
}