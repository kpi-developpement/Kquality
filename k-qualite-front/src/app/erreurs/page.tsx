"use client";

import { useEffect, useState } from 'react';
import { getErreurs } from '@/services/apiService';
import { ErreurResponseDTO } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import styles from './Erreurs.module.css';

export default function ErreursPage() {
  const { user } = useAuth();
  const [erreurs, setErreurs] = useState<ErreurResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.partenaireId) {
      getErreurs(user.partenaireId)
        .then(setErreurs)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <div className={styles.container}>Chargement...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Liste des Erreurs</h1>
        <p>Identifiez et traitez les écarts avant la clôture.</p>
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Dossier</th><th>Date</th><th>Technicien</th><th>Erreur</th><th>Impact</th><th>Échéance</th><th>Statut</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {erreurs.map((erreur) => (
              <tr key={erreur.id}>
                <td className={styles.reference}>{erreur.dossierReference}</td>
                <td>{new Date(erreur.dateDetection).toLocaleDateString()}</td>
                <td>{erreur.technicienNomComplet}</td>
                <td>{erreur.regleDescription}</td>
                <td className={styles.impact}>{erreur.impactEstime} €</td>
                <td>{new Date(erreur.echeanceContestation).toLocaleString()}</td>
                <td><span className={`${styles.badge} ${styles[erreur.statut.toLowerCase()]}`}>{erreur.statut}</span></td>
                <td><Link href={`/erreurs/${erreur.id}`} className={styles.actionBtn}>Consulter</Link></td>
              </tr>
            ))}
            {erreurs.length === 0 && <tr><td colSpan={8} className={styles.empty}>Aucune erreur trouvée.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}