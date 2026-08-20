import React, { useRef, useEffect } from 'react';
import styles from './InteractiveCard.module.css';

interface Props { children: React.ReactNode; delayIndex?: number; }

export default function InteractiveCard({ children, delayIndex = 0 }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const card = cardRef.current;
    if (!wrapper || !card) return;

    const handleMouseMove = (e: MouseEvent) => {
      requestAnimationFrame(() => {
        // 🚀 L'FIX: Kan-trakiw l'wrapper li FIXE machi l'carte li kat7erek
        const rect = wrapper.getBoundingClientRect();
        
        const xTilt = e.clientX - rect.left - rect.width / 2;
        const yTilt = e.clientY - rect.top - rect.height / 2;
        
        // Glare coordinates
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        
        // Physics (35 bach tji douce)
        const rotateX = -(yTilt / 35).toFixed(2);
        const rotateY = (xTilt / 35).toFixed(2);
        
        card.style.transition = 'none';
        card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });
    };

    const handleMouseLeave = () => {
      requestAnimationFrame(() => {
        card.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.6s ease';
        card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
    };

    // Event on WRAPPER, not CARD!
    wrapper.addEventListener('mousemove', handleMouseMove);
    wrapper.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      wrapper.removeEventListener('mousemove', handleMouseMove);
      wrapper.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div ref={wrapperRef} className={styles.cardWrapper} style={{ animationDelay: `${delayIndex * 0.1}s` }}>
      <div ref={cardRef} className={styles.cardInner}>
        <div className={styles.glare}></div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}