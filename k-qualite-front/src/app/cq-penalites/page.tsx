"use client";

import { useEffect, useState } from 'react';
import { getDashboardData, getErreurs } from '@/services/apiService';
import { DashboardPartenaireDTO, ErreurResponseDTO } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card/Card';
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

  if (loading || !data) return <div className={styles.container}>Chargement...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Résultats CQ & Pénalités</h1>
        <p>Comprendre les écarts et la projection des pénalités du mois.</p>
      </header>

      <div className={styles.summaryGrid}>
        <Card title="CQ Actuel" value={`${data.cqPrevisionnel} %`} subtitle="Résultat calculé à date" />
        <Card title="Objectif Contractuel" value={`${data.objectifCq} %`} subtitle="Seuil à atteindre" />
        <Card title="Écart" value={`${data.ecartCq} pts`} alert={data.ecartCq < 0} />
        <Card title="Pénalités Estimées" value={`${data.penalitesEstimees} €`} subtitle={data.statutPenalites} alert={data.penalitesEstimees > 0} />
      </div>

      <div className={styles.detailsSection}>
        <div className={styles.leftColumn}>
          <h2>Détail des indicateurs (Moteur de règles)</h2>
          <table className={styles.table}>
            <thead>
              <tr><th>Indicateur / Règle</th><th>Résultat</th><th>Impact estimé</th></tr>
            </thead>
            <tbody>
              {erreurs.map((erreur) => (
                <tr key={erreur.id}>
                  <td><strong>{erreur.regleDescription}</strong> ({erreur.regleCode})</td>
                  <td>{erreur.statut === 'ANNULE' ? <span className={styles.statusOk}>Annulé (Conforme)</span> : <span className={styles.statusNok}>Non Conforme</span>}</td>
                  <td className={styles.amount}>{erreur.impactEstime} €</td>
                </tr>
              ))}
              {erreurs.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>Aucune règle enfreinte ce mois-ci.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className={styles.rightColumn}>
          <h2>Projection Financière</h2>
          <div className={styles.projectionBox}>
            <div className={styles.projectionTag}>ESTIMATION</div>
            <div className={styles.projectionTotal}>{data.penalitesEstimees} €</div>
            <p className={styles.projectionSub}>si la période clôturait aujourd'hui</p>
            <hr className={styles.divider} />
            <div className={styles.projectionRow}><span>Pénalités Qualité</span><strong>{data.penalitesEstimees} €</strong></div>
            <div className={styles.projectionRow}><span>Plafonnement appliqué</span><strong>0 €</strong></div>
            <button className={styles.detailsBtn}>Télécharger le détail Excel</button>
          </div>
        </div>
      </div>
    </div>
  );
}