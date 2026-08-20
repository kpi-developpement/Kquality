"use client";

import { useEffect, useState, useMemo } from 'react';
import { getErreurs } from '@/services/apiService';
import { ErreurResponseDTO } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import InteractiveCard from '../admin/vue-globale/components/InteractiveCard/InteractiveCard'; // Re-utilisation dyal 3D wrapper
import styles from './Erreurs.module.css';

const ITEMS_PER_PAGE = 8;

export default function ErreursPage() {
  const { user } = useAuth();
  const [erreurs, setErreurs] = useState<ErreurResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user?.partenaireId) {
      getErreurs(user.partenaireId)
        .then(setErreurs)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const totalErreurs = erreurs.length;
  const impactGlobal = erreurs.reduce((acc, err) => acc + (err.impactEstime || 0), 0);
  const contestables = erreurs.filter(e => e.statut === 'NOUVEAU' || e.statut === 'A_ANALYSER').length;

  const totalPages = Math.ceil(totalErreurs / ITEMS_PER_PAGE);
  const paginatedErreurs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return erreurs.slice(start, start + ITEMS_PER_PAGE);
  }, [erreurs, currentPage]);

  const IconAlert = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
  const IconMoney = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
  const IconClock = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;

  if (loading) return <div className={styles.pageWrapper}><div style={{ textAlign: 'center', padding: '100px', fontWeight: 'bold', color: '#64748b' }}>Chargement sécurisé...</div></div>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <div className={styles.partnerBadge}>PORTAIL QUALITÉ</div>
            <h1>Registre des Erreurs</h1>
            <p>Consultez et contestez les écarts détectés sur vos interventions.</p>
          </div>
        </header>

        <div className={styles.kpiGrid}>
          <InteractiveCard delayIndex={1}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}>{IconAlert}</div>
                <h3 className={styles.kpiTitle}>Total Erreurs</h3>
              </div>
              <p className={styles.kpiValue}>{totalErreurs.toLocaleString('fr-FR')}</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={2}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#fef2f2', color: '#ef4444' }}>{IconMoney}</div>
                <h3 className={styles.kpiTitle}>Impact Financier Global</h3>
              </div>
              <p className={`${styles.kpiValue} ${styles.valueRed}`}>{impactGlobal.toLocaleString('fr-FR')} €</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={3}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#fffbeb', color: '#f59e0b' }}>{IconClock}</div>
                <h3 className={styles.kpiTitle}>À Contester (Urgent)</h3>
              </div>
              <p className={styles.kpiValue} style={{ color: '#f59e0b' }}>{contestables}</p>
            </div>
          </InteractiveCard>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Dossier</th><th>Date</th><th>Technicien</th><th>Erreur</th><th>Impact</th><th>Échéance</th><th>Statut</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedErreurs.map((erreur, index) => {
                const isExpired = new Date() > new Date(erreur.echeanceContestation);
                return (
                  <tr key={`${erreur.id}-${currentPage}`} className={styles.tableRow} style={{ animationDelay: `${index * 0.05}s` }}>
                    <td><span className={styles.reference}>{erreur.dossierReference}</span></td>
                    <td style={{ fontWeight: '800', color: '#64748b' }}>{new Date(erreur.dateDetection).toLocaleDateString()}</td>
                    <td style={{ fontWeight: '800' }}>{erreur.technicienNomComplet}</td>
                    <td style={{ color: '#475569', fontWeight: '600' }}>{erreur.regleDescription}</td>
                    <td className={styles.impact}>{erreur.impactEstime} €</td>
                    <td style={{ fontWeight: '700', color: isExpired ? '#ef4444' : '#10b981' }}>
                      {new Date(erreur.echeanceContestation).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[erreur.statut.toLowerCase()] || styles.badge_default}`}>
                        {erreur.statut.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <Link href={`/erreurs/${erreur.id}`} className={styles.actionBtn}>Détails</Link>
                    </td>
                  </tr>
                );
              })}
              {paginatedErreurs.length === 0 && <tr><td colSpan={8} className={styles.empty}>Aucune anomalie détectée pour le moment.</td></tr>}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.paginationWrapper}>
            <span className={styles.pageInfo}>Affichage {((currentPage - 1) * ITEMS_PER_PAGE) + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, totalErreurs)} sur {totalErreurs}</span>
            <div className={styles.pageControls}>
              <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>&lt;</button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return <button key={page} className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>;
                }
                if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} style={{ color: '#94a3b8', padding: '0 5px' }}>...</span>;
                return null;
              })}
              <button className={styles.pageBtn} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>&gt;</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}