import React from 'react';
import styles from './PenaltyPipeline.module.css';

interface Props {
  detectees: number;
  contestees: number;
  validees: number;
  vision: 'ADMIN' | 'PARTENAIRE';
}

export default function PenaltyPipeline({ detectees, contestees, validees, vision }: Props) {
  const formatPenalty = (val: number) => val === 0 ? '0 €' : `-${Math.abs(val).toLocaleString('fr-FR')} €`;

  return (
    <div className={styles.pipelineContainer}>
      <div className={styles.header}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        <h3>Pénalités {vision === 'ADMIN' ? '(Montant)' : '(MT SST)'}</h3>
      </div>
      
      <div className={styles.steps}>
        <div className={`${styles.step} ${styles.danger}`}>
          <div className={styles.circle}>1</div>
          <span className={styles.label}>Détectées</span>
          <span className={styles.amount}>{formatPenalty(detectees)}</span>
        </div>
        
        <div className={`${styles.step} ${styles.active}`}>
          <div className={styles.circle}>2</div>
          <span className={styles.label}>En Contestation</span>
          <span className={styles.amount}>{formatPenalty(contestees)}</span>
        </div>
        
        <div className={`${styles.step} ${styles.success}`}>
          <div className={styles.circle}>3</div>
          <span className={styles.label}>Validées</span>
          <span className={styles.amount}>{formatPenalty(validees)}</span>
        </div>
      </div>
    </div>
  );
}