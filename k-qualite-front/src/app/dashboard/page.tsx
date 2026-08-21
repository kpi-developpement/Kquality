"use client";

import { useEffect, useState } from 'react';
import { getDashboardData } from '@/services/apiService';
import { DashboardPartenaireDTO } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import InteractiveCard from '../admin/vue-globale/components/InteractiveCard/InteractiveCard'; // L'composant 3D dylna
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardPartenaireDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.partenaireId) {
      getDashboardData(user.partenaireId)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading || !data) return <div className={styles.pageWrapper}><div style={{ textAlign: 'center', padding: '100px', fontWeight: 'bold', color: '#64748b' }}>Chargement sécurisé du Dashboard...</div></div>;

  const IconTarget = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;
  const IconFile = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
  const IconAlert = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <div className={styles.partnerBadge}>PORTAIL QUALITÉ</div>
            <h1>Vue d'ensemble Opérationnelle</h1>
            <p>Performances et risques financiers pour la période en cours.</p>
          </div>
        </header>

        <div className={styles.grid}>
          {/* 🚀 IMPACT VAULT - PENALITES ESTIMEES */}
          <div style={{ gridColumn: 'span 2' }}>
            <InteractiveCard delayIndex={1}>
              <div className={styles.impactVault}>
                <div className={styles.vaultHeader}>
                  <h3 className={styles.vaultTitle}>Risque Financier (Pénalités Estimées)</h3>
                  <div className={styles.liveIndicator}>
                    <div className={styles.dot}></div> LIVE
                  </div>
                </div>

                <div className={styles.vaultMain}>
                  <div className={styles.radarRing1}></div>
                  <div className={styles.radarRing2}></div>
                  <h2 className={styles.vaultAmount}>{data.penalitesEstimees.toLocaleString('fr-FR')} €</h2>
                  <span className={styles.vaultSub}>Estimation à la clôture</span>
                </div>
              </div>
            </InteractiveCard>
          </div>

          <InteractiveCard delayIndex={2}>
            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiHeader}>
                  <div className={styles.kpiIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}>{IconTarget}</div>
                  <h3 className={styles.kpiTitle}>CQ Prévisionnel</h3>
                </div>
                <p className={styles.kpiValue} style={{ color: '#3b82f6', marginTop: '15px' }}>{data.cqPrevisionnel}%</p>
                <div className={styles.energyTrack}>
                  <div className={styles.energyFill} style={{ width: `${Math.min(data.cqPrevisionnel, 100)}%`, backgroundColor: '#3b82f6', boxShadow: `0 0 15px rgba(59,130,246,0.6)` }}>
                    <div className={styles.energySpark} style={{ color: '#3b82f6' }}></div>
                  </div>
                </div>
                <span className={styles.badgeInfo}>Objectif: {data.objectifCq}% (Écart: {data.ecartCq})</span>
              </div>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={3}>
            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiHeader}>
                  <div className={styles.kpiIcon} style={{ background: '#fef2f2', color: '#ef4444' }}>{IconAlert}</div>
                  <h3 className={styles.kpiTitle}>Erreurs Actives</h3>
                </div>
                <p className={styles.kpiValue} style={{ color: '#ef4444', marginTop: '15px' }}>{data.erreursActives}</p>
                {data.erreursUrgentes > 0 ? (
                  <span className={styles.badgeAlert}>⚠️ {data.erreursUrgentes} urgentes (sous 48h)</span>
                ) : (
                  <span className={styles.badgeInfo}>Aucune urgence</span>
                )}
              </div>
            </div>
          </InteractiveCard>

        </div>
      </div>
    </div>
  );
}