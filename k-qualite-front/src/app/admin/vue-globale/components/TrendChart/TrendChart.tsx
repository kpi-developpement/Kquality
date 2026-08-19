import React from 'react';
import styles from './TrendChart.module.css';

interface Props {
  data: number[];
  labels: string[];
  isLoading: boolean;
}

export default function TrendChart({ data, labels, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.header}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          <h3>Évolution du Score Global</h3>
        </div>
        <div className={styles.loading}>Calcul de l'historique en cours...</div>
      </div>
    );
  }

  // Calcul des coordonnées SVG
  const minVal = Math.min(...data.filter(d => d > 0), 80) - 5; // Dynamic Y-axis
  const maxVal = Math.max(...data, 100);
  const range = maxVal - minVal || 1;

  const points = data.map((val, i) => {
    const x = (i / (Math.max(data.length - 1, 1))) * 100;
    const y = val === 0 ? 100 : 100 - ((val - minVal) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className={styles.chartContainer}>
      <div className={styles.header}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
        <h3>Évolution du Score Global (6 derniers mois)</h3>
      </div>
      
      <svg className={styles.svgChart} viewBox="0 -10 100 125" preserveAspectRatio="none">
        <defs>
          <linearGradient id="blueGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Lignes de fond */}
        {[0, 25, 50, 75, 100].map(line => (
          <line key={line} x1="0" y1={line} x2="100" y2={line} className={styles.gridLine} />
        ))}
        
        {/* Zone dégradée */}
        <polygon points={areaPoints} className={styles.dataArea} />
        
        {/* Ligne principale */}
        <polyline points={points} className={styles.dataLine} />
        
        {/* Points et Textes */}
        {data.map((val, i) => {
          const x = (i / (Math.max(data.length - 1, 1))) * 100;
          const y = val === 0 ? 100 : 100 - ((val - minVal) / range) * 100;
          return (
            <g key={i}>
              <circle cx={x} cy={y} className={styles.dataPoint} />
              <text x={x} y="118" textAnchor="middle" className={styles.axisText}>{labels[i]}</text>
              <text x={x} y={y - 5} textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="bold">
                {val > 0 ? `${val.toFixed(1)}%` : '-'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}