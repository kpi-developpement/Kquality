"use client";

import { useEffect, useState } from 'react';
import { getDashboardData, getErreurs } from '@/services/apiService';
import { DashboardPartenaireDTO, ErreurResponseDTO } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import InteractiveCard from '../admin/vue-globale/components/InteractiveCard/InteractiveCard'; // L'composant 3D
import styles from './CqPenalites.module.css';

export default function CqPenalitesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardPartenaireDTO | null>(null);
  const [erreurs, setErreurs] = useState<ErreurResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.partenaireId) {
      Promise.all([
        getDashboardData(user.partenaireId),
        getErreurs(user.partenaireId)
      ]).then(([dashboardRes, erreursRes]) => {
        setData(dashboardRes);
        setErreurs(erreursRes);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [user]);

  if (loading || !data) return <div className={styles.pageWrapper}><div style={{ textAlign: 'center', padding: '100px', fontWeight: 'bold', color: '#64748b' }}>Chargement des pénalités...</div></div>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <div className={styles.partnerBadge}>PORTAIL QUALITÉ</div>
            <h1>Résultats CQ & Pénalités</h1>
            <p>Comprendre les écarts et la projection des pénalités du mois.</p>
          </div>
        </header>

        <div className={styles.detailsSection}>
          <div className={styles.leftColumn}>
            <h2>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Détail des indicateurs (Moteur de règles)
            </h2>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Indicateur / Règle</th><th>Résultat</th><th>Impact estimé</th></tr>
                </thead>
                <tbody>
                  {erreurs.map((erreur, index) => (
                    <tr key={erreur.id} className={styles.tableRow} style={{ animationDelay: `${index * 0.05}s` }}>
                      <td><span style={{ color: '#64748b', fontWeight: '900', marginRight: '8px' }}>[{erreur.regleCode}]</span><strong>{erreur.regleDescription}</strong></td>
                      <td>{erreur.statut === 'ANNULE' ? <span className={styles.statusOk}>Annulé (Conforme)</span> : <span className={styles.statusNok}>Non Conforme</span>}</td>
                      <td className={styles.amount}>{erreur.impactEstime} €</td>
                    </tr>
                  ))}
                  {erreurs.length === 0 && <tr><td colSpan={3} className={styles.empty}>Aucune règle enfreinte ce mois-ci. Excellent travail!</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.rightColumn}>
            <InteractiveCard delayIndex={1}>
              <div className={styles.impactVault}>
                <div className={styles.vaultHeader}>
                  <h3 className={styles.vaultTitle}>Projection Financière</h3>
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

                <div className={styles.projectionRow}>
                  <span>Pénalités Qualité</span>
                  <strong style={{ color: '#ef4444' }}>{data.penalitesEstimees.toLocaleString('fr-FR')} €</strong>
                </div>
                <div className={styles.projectionRow}>
                  <span>Plafonnement appliqué</span>
                  <strong style={{ color: '#10b981' }}>0 €</strong>
                </div>
                
                <button className={styles.detailsBtn}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Télécharger le détail Excel
                </button>
              </div>
            </InteractiveCard>
          </div>
        </div>
      </div>
    </div>
  );
}