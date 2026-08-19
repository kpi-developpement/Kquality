import React from 'react';
import styles from './TrendChart.module.css';

interface Props {
  dataRacc: number[];
  dataSav: number[];
  labels: string[];
  isLoading: boolean;
}

export default function TrendChart({ dataRacc, dataSav, labels, isLoading }: Props) {
  if (isLoading || !dataRacc.length) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <span className={styles.subtitle}>PERFORMANCE</span>
            <h3>Évolution du CQ</h3>
          </div>
        </div>
        <div className={styles.loading}>Calcul des courbes premium en cours...</div>
      </div>
    );
  }

  // Configuration de l'échelle (Base 90 à 100%)
  const MIN_Y = 90; 
  const MAX_Y = 100;
  const RANGE = MAX_Y - MIN_Y;

  // Viewbox absolu (Fix pour éviter que le chart disparaisse)
  const width = 800;
  const height = 240;
  
  const getX = (index: number) => (index / Math.max(labels.length - 1, 1)) * width;
  const getY = (val: number) => {
    if(val === 0) return height; // Drop to bottom if 0
    const clampedVal = Math.max(MIN_Y, Math.min(MAX_Y, val));
    return height - ((clampedVal - MIN_Y) / RANGE) * height;
  };

  // Mathématique pure pour une courbe de Bézier Horizontale (Smooth)
  const generateSmoothPath = (data: number[]) => {
    if (!data || data.length === 0) return '';
    let path = `M ${getX(0)},${getY(data[0])}`;
    for (let i = 0; i < data.length - 1; i++) {
      const x0 = getX(i);
      const y0 = getY(data[i]);
      const x1 = getX(i + 1);
      const y1 = getY(data[i + 1]);
      const cx = (x0 + x1) / 2; // Point de contrôle central
      path += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
    }
    return path;
  };

  const pathRacc = generateSmoothPath(dataRacc);
  const pathSav = generateSmoothPath(dataSav);

  const areaRacc = pathRacc ? `${pathRacc} L ${width},${height} L 0,${height} Z` : '';
  const areaSav = pathSav ? `${pathSav} L ${width},${height} L 0,${height} Z` : '';

  const yAxisValues = [92, 95, 98, 100];

  return (
    <div className={styles.chartContainer}>
      
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <span className={styles.subtitle}>PERFORMANCE</span>
          <h3>Évolution du CQ</h3>
        </div>
        
        <div className={styles.legendArea}>
          <div className={styles.legendItem}>
            <div className={`${styles.dot} ${styles.dotRed}`}></div> RACC
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.dot} ${styles.dotGreen}`}></div> SAV
          </div>
          <select className={styles.timeSelect}>
            <option>6 mois</option>
            <option>1 an</option>
          </select>
        </div>
      </div>
      
      {/* viewBox Fixe bach dima yban w ma-yt9te3ch */}
      <svg className={styles.svgChart} viewBox={`-30 -10 ${width + 40} ${height + 40}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="redGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="greenGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Lignes de fond pointillées (Grid) */}
        {yAxisValues.map(val => {
          const y = getY(val);
          return (
            <g key={`grid-${val}`}>
              <line x1="0" y1={y} x2={width} y2={y} className={styles.gridLine} />
              <text x="-25" y={y + 4} className={styles.axisTextY}>{val}%</text>
            </g>
          );
        })}
        
        {/* Remplissage sous la courbe (Area) */}
        {areaSav && <path d={areaSav} className={`${styles.dataArea} ${styles.areaGreen}`} />}
        {areaRacc && <path d={areaRacc} className={`${styles.dataArea} ${styles.areaRed}`} />}
        
        {/* Les courbes lissées */}
        {pathSav && <path d={pathSav} className={`${styles.dataLine} ${styles.lineGreen}`} />}
        {pathRacc && <path d={pathRacc} className={`${styles.dataLine} ${styles.lineRed}`} />}
        
        {/* Points SAV (Vert) */}
        {dataSav.map((val, i) => (
          <circle 
            key={`sav-${i}`} 
            cx={getX(i)} cy={getY(val)} 
            className={`${styles.dataPoint} ${styles.pointGreen}`} 
            style={{ animationDelay: `${0.8 + i * 0.1}s` }}
          />
        ))}

        {/* Points RACC (Rouge) */}
        {dataRacc.map((val, i) => (
          <circle 
            key={`racc-${i}`} 
            cx={getX(i)} cy={getY(val)} 
            className={`${styles.dataPoint} ${styles.pointRed}`} 
            style={{ animationDelay: `${1.2 + i * 0.1}s` }}
          />
        ))}

        {/* Textes en bas (Mois) */}
        {labels.map((label, i) => (
          <text key={`label-${i}`} x={getX(i)} y={height + 25} textAnchor="middle" className={styles.axisTextX}>
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}