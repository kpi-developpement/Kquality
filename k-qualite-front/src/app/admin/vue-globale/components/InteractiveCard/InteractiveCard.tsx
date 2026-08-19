import React, { useRef } from 'react';
import styles from './InteractiveCard.module.css';

interface Props { children: React.ReactNode; delayIndex?: number; }

export default function InteractiveCard({ children, delayIndex = 0 }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    // 🚀 L'FIX FPS HNA: requestAnimationFrame bach y-matchi le taux de rafraîchissement de l'écran (60/120Hz)
    requestAnimationFrame(() => {
      const rect = cardRef.current!.getBoundingClientRect();
      
      const xTilt = e.clientX - rect.left - rect.width / 2;
      const yTilt = e.clientY - rect.top - rect.height / 2;
      const xPos = e.clientX - rect.left;
      const yPos = e.clientY - rect.top;

      // Injection directe f l'DOM (0 lag, 0 re-render React)
      cardRef.current!.style.setProperty('--mouse-x', `${xPos}px`);
      cardRef.current!.style.setProperty('--mouse-y', `${yPos}px`);
      
      const rotateX = -(yTilt / 35).toFixed(2);
      const rotateY = (xTilt / 35).toFixed(2);
      
      cardRef.current!.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      cardRef.current!.style.transition = 'none'; // Fast tracking f l'hover
    });
  };

  const handleMouseLeave = () => { 
    if (!cardRef.current) return;
    requestAnimationFrame(() => {
      cardRef.current!.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'; 
      cardRef.current!.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)'; // Smooth return
    });
  };

  return (
    <div className={styles.cardWrapper} style={{ animationDelay: `${delayIndex * 0.1}s` }}>
      <div 
        ref={cardRef} 
        className={styles.cardInner} 
        onMouseMove={handleMouseMove} 
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.glare}></div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}