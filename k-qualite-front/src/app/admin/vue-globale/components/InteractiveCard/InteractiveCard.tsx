import React, { useRef, useState } from 'react';
import styles from './InteractiveCard.module.css';

interface Props {
  children: React.ReactNode;
  delayIndex?: number;
}

export default function InteractiveCard({ children, delayIndex = 0 }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to the center of the card
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Adjust these values to make the tilt more or less intense
    const rotateX = -(y / 20).toFixed(2);
    const rotateY = (x / 20).toFixed(2);
    
    setTransformStyle(`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransformStyle('rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <div className={styles.cardWrapper} style={{ animation: `fadeIn 0.6s ease-out forwards ${delayIndex * 0.1}s`, opacity: 0 }}>
      <div 
        ref={cardRef}
        className={styles.cardInner} 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ transform: transformStyle, transition: transformStyle === 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)' ? 'transform 0.5s ease-out' : 'transform 0.1s ease-out' }}
      >
        <div className={styles.animatedBg}>
          <div className={styles.blob1}></div>
          <div className={styles.blob2}></div>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}