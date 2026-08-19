import React, { useRef, useState } from 'react';
import styles from './InteractiveCard.module.css';

interface Props { children: React.ReactNode; delayIndex?: number; }

export default function InteractiveCard({ children, delayIndex = 0 }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Tilt premium ultra-doux
    const rotateX = -(y / 30).toFixed(2);
    const rotateY = (x / 30).toFixed(2);
    setTransformStyle(`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`);
  };

  const handleMouseLeave = () => { 
    setTransformStyle('rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'); 
  };

  return (
    <div className={styles.cardWrapper} style={{ animationDelay: `${delayIndex * 0.1}s` }}>
      <div 
        ref={cardRef} 
        className={styles.cardInner} 
        onMouseMove={handleMouseMove} 
        onMouseLeave={handleMouseLeave}
        style={{ 
          transform: transformStyle, 
          transition: transformStyle === 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)' ? 'transform 0.4s ease-out' : 'transform 0.1s ease-out' 
        }}
      >
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}