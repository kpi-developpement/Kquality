import React, { useRef, useState } from 'react';
import styles from './InteractiveCard.module.css';

interface Props { children: React.ReactNode; delayIndex?: number; }

export default function InteractiveCard({ children, delayIndex = 0 }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // 🚀 Coordinates for the 3D Tilt
    const xTilt = e.clientX - rect.left - rect.width / 2;
    const yTilt = e.clientY - rect.top - rect.height / 2;
    
    // 🚀 Coordinates for the Glare Effect (Zlaj)
    const xPos = e.clientX - rect.left;
    const yPos = e.clientY - rect.top;

    // Injecting CSS variables dynamically for the glare to follow the mouse
    cardRef.current.style.setProperty('--mouse-x', `${xPos}px`);
    cardRef.current.style.setProperty('--mouse-y', `${yPos}px`);
    
    // Deeper, smoother tilt
    const rotateX = -(yTilt / 25).toFixed(2);
    const rotateY = (xTilt / 25).toFixed(2);
    setTransformStyle(`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => { 
    setTransformStyle('rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'); 
  };

  return (
    <div className={styles.cardWrapper} style={{ animationDelay: `${delayIndex * 0.12}s` }}>
      <div 
        ref={cardRef} 
        className={styles.cardInner} 
        onMouseMove={handleMouseMove} 
        onMouseLeave={handleMouseLeave}
        style={{ 
          transform: transformStyle, 
          transition: transformStyle === 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)' ? 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'transform 0.1s ease-out' 
        }}
      >
        <div className={styles.glare}></div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}