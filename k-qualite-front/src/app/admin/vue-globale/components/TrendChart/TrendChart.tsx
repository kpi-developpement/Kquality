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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          <h3>Évolution du Score Global</h3>
        </div>
        <div className={styles.loading}>Calcul de l'historique premium en cours...</div>
      </div>
    );
  }

  // Calcul des coordonnées
  const minVal = Math.min(...data.filter(d => d > 0), 80) - 5; 
  const maxVal = Math.max(...data, 100);
  const range = maxVal - minVal || 1;

  const getX = (index: number) => (index / Math.max(data.length - 1, 1)) * 100;
  const getY = (val: number) => val === 0 ? 100 : 100 - ((val - minVal) / range) * 100;

  // 🛡️ L'FIX HWA HNA: Transformation de Polyline en Courbe de Bézier Cubique (Smooth Path)
  let smoothPath = '';
  if (data.length > 0) {
    smoothPath = `M ${getX(0)},${getY(data[0])}`;
    for (let i = 0; i < data.length - 1; i++) {
      const x0 = getX(i);
      const y0 = getY(data[i]);
      const x1 = getX(i + 1);
      const y1 = getY(data[i + 1]);
      
      // Points de contrôle pour courber la ligne mathématiquement
      const cx = (x0 + x1) / 2;
      smoothPath += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
    }
  }

  // Zone d'ombre sous la courbe
  const areaPath = smoothPath ? `${smoothPath} L 100,100 L 0,100 Z` : '';

  return (
    <div className={styles.chartContainer}>
      <div className={styles.header}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 2px 4px rgba(59,130,246,0.4))' }}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <h3>Évolution du Score Global (6 derniers mois)</h3>
      </div>
      
      <svg className={styles.svgChart} viewBox="0 -10 100 125" preserveAspectRatio="none">
        <defs>
          <linearGradient id="blueGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#eff6ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Lignes de fond pointillées */}
        {[0, 25, 50, 75, 100].map(line => (
          <line key={line} x1="0" y1={line} x2="100" y2={line} className={styles.gridLine} />
        ))}
        
        {/* Zone dégradée fluide */}
        {areaPath && <path d={areaPath} className={styles.dataArea} />}
        
        {/* Ligne courbe principale */}
        {smoothPath && <path d={smoothPath} className={styles.dataLine} />}
        
        {/* Points et Textes */}
        {data.map((val, i) => {
          const x = getX(i);
          const y = getY(val);
          // Délai d'apparition des points proportionnel à leur position
          const animDelay = `${0.8 + (i * 0.1)}s`; 

          return (
            <g key={i}>
              <circle cx={x} cy={y} className={styles.dataPoint} style={{ animationDelay: animDelay }} />
              <text x={x} y="118" textAnchor="middle" className={styles.axisText}>{labels[i]}</text>
              <text x={x} y={y - 8} textAnchor="middle" className={styles.valueText} style={{ animationDelay: animDelay }}>
                {val > 0 ? `${val.toFixed(1)}%` : '-'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}