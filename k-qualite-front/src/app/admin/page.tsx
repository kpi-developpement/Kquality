"use client"; 

import { useEffect, useState, useMemo } from 'react';
import { getContestationsEnAttente, traiterContestation } from '@/services/apiService';
import { ContestationResponseDTO } from '@/types/api'; 
import Link from 'next/link';
import InteractiveCard from './vue-globale/components/InteractiveCard/InteractiveCard'; 
import styles from './Admin.module.css';

const ITEMS_PER_PAGE = 8; // 🚀 Pagination

export default function AdminContestationsPage() {
  const [contestations, setContestations] = useState<ContestationResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchContestations = async () => {
    try {
      const data = await getContestationsEnAttente();
      setContestations(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContestations();
  }, []);

  const handleTraitement = async (id: number, accepter: boolean) => {
    const commentaire = prompt(`Veuillez saisir un commentaire pour ${accepter ? 'ACCEPTER' : 'REFUSER'} cette contestation:`);
    if (commentaire === null) return; 

    try {
      await traiterContestation(id, accepter, commentaire);
      alert(`Contestation ${accepter ? 'acceptée' : 'refusée'} avec succès !`);
      fetchContestations(); 
    } catch (error) {
      alert("Erreur lors du traitement");
    }
  };

  // 🚀 KPIs Calculés en temps réel
  const totalEnAttente = contestations.length;
  const impactBloque = contestations.reduce((acc, c) => acc + (c.impactEstime || 0), 0);

  // 🚀 Logique Pagination
  const totalPages = Math.ceil(totalEnAttente / ITEMS_PER_PAGE);
  const paginatedContestations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return contestations.slice(start, start + ITEMS_PER_PAGE);
  }, [contestations, currentPage]);

  const IconAlert = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
  const IconLock = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <div className={styles.adminBadge}>CENTRE D'ARBITRAGE</div>
            <h1>Gestion des Contestations</h1>
            <p>Traitez les réclamations des partenaires avant la clôture mensuelle.</p>
          </div>
          <Link href="/admin/vue-globale" className={styles.btnDashboard}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Vue Globale KPI
          </Link>
        </header>

        {/* 🚀 KPI CARDS (INTERACTIVE 3D) */}
        <div className={styles.kpiGrid}>
          <InteractiveCard delayIndex={1}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#fffbeb', color: '#f59e0b' }}>{IconAlert}</div>
                <h3 className={styles.kpiTitle}>Dossiers en Attente</h3>
              </div>
              <p className={styles.kpiValue}>{totalEnAttente}</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={2}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#fef2f2', color: '#ef4444' }}>{IconLock}</div>
                <h3 className={styles.kpiTitle}>Impact Financier Bloqué</h3>
              </div>
              <p className={styles.kpiValue} style={{ color: '#ef4444' }}>{impactBloque.toLocaleString('fr-FR')} €</p>
            </div>
          </InteractiveCard>
        </div>

        <div className={styles.tableWrapper}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Chargement de l'espace d'arbitrage...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Partenaire</th>
                  <th>Dossier</th>
                  <th>Motif Soulevé</th>
                  <th>Argumentaire Partenaire</th>
                  <th>Impact</th>
                  <th>Arbitrage</th>
                </tr>
              </thead>
              <tbody>
                {paginatedContestations.map((c, index) => (
                  <tr key={`${c.id}-${currentPage}`} className={styles.tableRow} style={{ animationDelay: `${index * 0.05}s` }}>
                    <td className={styles.bold}>
                       <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#3b82f6', display:'inline-block', marginRight:'8px' }}></span>
                       {c.partenaireNom}
                    </td>
                    <td><span className={styles.reference}>{c.dossierReference}</span></td>
                    <td><span className={styles.motifBadge}>{c.motif.replace('_', ' ')}</span></td>
                    <td className={styles.commentCell} title={c.commentaire}>{c.commentaire || '-'}</td>
                    <td className={styles.impact}>{c.impactEstime} €</td>
                    <td>
                      <div className={styles.actionsBox}>
                        <button onClick={() => handleTraitement(c.id, true)} className={styles.btnAccept}>Accepter</button>
                        <button onClick={() => handleTraitement(c.id, false)} className={styles.btnReject}>Refuser</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedContestations.length === 0 && (
                  <tr>
                    <td colSpan={6} className={styles.empty}>Aucune contestation en attente d'arbitrage.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 🚀 PAGINATION BAR */}
        {!loading && totalPages > 1 && (
          <div className={styles.paginationWrapper}>
            <span className={styles.pageInfo}>
              Affichage {((currentPage - 1) * ITEMS_PER_PAGE) + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, totalEnAttente)} sur {totalEnAttente}
            </span>
            <div className={styles.pageControls}>
              <button 
                className={styles.pageBtn} 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >&lt;</button>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return <button key={page} className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>;
                }
                if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} style={{ color: '#94a3b8', padding: '0 5px' }}>...</span>;
                return null;
              })}

              <button 
                className={styles.pageBtn} 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >&gt;</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}