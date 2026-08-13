"use client";

import { useEffect, useState } from 'react';
import { getDashboardData } from '@/services/apiService';
import { DashboardPartenaireDTO } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card/Card';
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

  if (loading || !data) return <div className={styles.container}>Chargement...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Vue d'ensemble - K-Qualité</h1>
        <p>Période: Août 2026</p>
      </header>

      <div className={styles.grid}>
        <Card title="CQ Prévisionnel" value={`${data.cqPrevisionnel}%`} subtitle={`Objectif: ${data.objectifCq}% (Écart:${data.ecartCq})`} />
        <Card title="Dossiers Contrôlés" value={data.totalDossiersControles} />
        <Card title="Erreurs Actives" value={data.erreursActives} subtitle={`${data.erreursUrgentes} urgentes (sous 48h)`} alert={data.erreursUrgentes > 0} />
        <Card title="Pénalités Estimées" value={`${data.penalitesEstimees} €`} subtitle={`Statut: ${data.statutPenalites}`} alert={true} />
      </div>
    </div>
  );
}