"use client";

import React from 'react';
import styles from './HoloChart.module.css';

interface Props {
  data: number[];
  labels: string[];
}

export default function HoloChart({ data, labels }: Props) {
  // Pure SVG Chart generation for maximum performance and styling
  const maxVal = Math.max(...data, 100);
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (val / maxVal) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={styles.chartContainer}>
      <h3>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
        Évolution du Score Global (6 derniers mois)
      </h3>
      
      <svg className={styles.svgChart} viewBox="0 -10 100 120" preserveAspectRatio="none">
        {/* Grid */}
        {[0, 25, 50, 75, 100].map(line => (
          <line key={line} x1="0" y1={line} x2="100" y2={line} className={styles.gridLine} />
        ))}
        
        {/* Line */}
        <polyline points={points} className={styles.dataLine} />
        
        {/* Points & Labels */}
        {data.map((val, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - (val / maxVal) * 100;
          return (
            <g key={i}>
              <circle cx={x} cy={y} className={styles.dataPoint} />
              <text x={x} y="115" textAnchor="middle" className={styles.axisText}>{labels[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}