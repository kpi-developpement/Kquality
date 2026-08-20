import React, { useRef, useEffect } from 'react';
import styles from './InteractiveCard.module.css';

interface Props { children: React.ReactNode; delayIndex?: number; }

export default function InteractiveCard({ children, delayIndex = 0 }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        
        const xTilt = e.clientX - rect.left - rect.width / 2;
        const yTilt = e.clientY - rect.top - rect.height / 2;
        
        // Coordinates for the Glare (Lma3an)
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        
        // Physics dyal l'miel
        const rotateX = -(yTilt / 35).toFixed(2);
        const rotateY = (xTilt / 35).toFixed(2);
        
        // L'FIX: Kan-7eydo transition f l'hover bach may-glitchich
        card.style.transition = 'none';
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });
    };

    const handleMouseLeave = () => {
      requestAnimationFrame(() => {
        // L'FIX: Kan-rddo transition mli katkhrej la souris bach yrje3 b slasa
        card.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s ease';
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
    };

    // Event Listeners direct f l'DOM
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className={styles.cardWrapper} style={{ animationDelay: `${delayIndex * 0.1}s` }}>
      {/* Ref hna, ma b9ach fih React Events */}
      <div ref={cardRef} className={styles.cardInner}>
        <div className={styles.glare}></div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}