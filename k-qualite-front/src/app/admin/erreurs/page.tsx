"use client";

import { useEffect, useState, useMemo } from 'react';
import { getAdminErreurs, getAdminPartenaires } from '@/services/apiService';
import { ErreurResponseDTO, PartenaireDTO } from '@/types/api';
import Link from 'next/link';
import CustomSelect from '../vue-globale/components/CustomSelect/CustomSelect'; 
import InteractiveCard from '../vue-globale/components/InteractiveCard/InteractiveCard'; 
import styles from './AdminErreurs.module.css';

const ITEMS_PER_PAGE = 8;

export default function AdminErreursPage() {
  const [erreurs, setErreurs] = useState<ErreurResponseDTO[]>([]);
  const [partenaires, setPartenaires] = useState<PartenaireDTO[]>([]);
  const [selectedPartenaire, setSelectedPartenaire] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPartenaire]);

  useEffect(() => {
    getAdminPartenaires().then(setPartenaires).catch(console.error); //[cite: 5]
  }, []);

  useEffect(() => {
    setLoading(true);
    getAdminErreurs(selectedPartenaire) //[cite: 5]
      .then(setErreurs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedPartenaire]);

  const totalErreurs = erreurs.length;
  const impactGlobal = erreurs.reduce((acc, err) => acc + (err.impactEstime || 0), 0);
  
  const partenaireOptions = [
    { value: "ALL", label: `Vue Globale (Tous les partenaires)` },
    ...partenaires.map(p => ({ value: p.id.toString(), label: p.nomEntreprise }))
  ];

  const totalPages = Math.ceil(totalErreurs / ITEMS_PER_PAGE);
  const paginatedErreurs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return erreurs.slice(start, start + ITEMS_PER_PAGE);
  }, [erreurs, currentPage]);

  const IconAlert = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
  const IconMoney = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
  const IconUser = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      <div className={styles.container}>
        
        <header className={styles.header}>
          <div>
            <div className={styles.adminBadge}>CENTRE DE CONTRÔLE</div>
            <h1>Suivi des Erreurs</h1>
            <p>Supervisez les anomalies détectées et leur impact financier.</p>
          </div>
          
          <div className={styles.filtersWrapper}>
            <div className={styles.filterLabel}>
              <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Filtrer par Partenaire
            </div>
            <CustomSelect 
              value={selectedPartenaire} 
              options={partenaireOptions} 
              onChange={setSelectedPartenaire} 
              width="300px" 
            />
          </div>
        </header>

        <div className={styles.kpiGrid}>
          <InteractiveCard delayIndex={1}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}>{IconAlert}</div>
                <h3 className={styles.kpiTitle}>Total Erreurs Détectées</h3>
              </div>
              <p className={styles.kpiValue}>{totalErreurs.toLocaleString('fr-FR')}</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={2}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#fef2f2', color: '#ef4444' }}>{IconMoney}</div>
                <h3 className={styles.kpiTitle}>Impact Financier Estimé</h3>
              </div>
              <p className={`${styles.kpiValue} ${styles.valueRed}`}>{impactGlobal.toLocaleString('fr-FR')} €</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={3}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#f8fafc', color: '#475569' }}>{IconUser}</div>
                <h3 className={styles.kpiTitle}>Filtre Actif</h3>
              </div>
              <p className={styles.kpiValue} style={{ fontSize: selectedPartenaire === "ALL" ? '24px' : '32px' }}>
                {selectedPartenaire === "ALL" ? "Tous les partenaires" : partenaires.find(p => p.id.toString() === selectedPartenaire)?.nomEntreprise || "-"}
              </p>
            </div>
          </InteractiveCard>
        </div>

        <div className={styles.tableWrapper}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Récupération du registre des erreurs...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Partenaire</th>
                  <th>Dossier</th>
                  <th>Date</th>
                  <th>Technicien</th>
                  {/* 🚀 L'FIX HNA: ZEDT CATÉGORIE W BDDLT DESCRIPTION L SOUS CATEGORIE */}
                  <th>Catégorie</th>
                  <th>Sous Catégorie</th>
                  <th>Impact</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedErreurs.map((erreur, index) => (
                  <tr key={`${erreur.id}-${currentPage}`} className={styles.tableRow} style={{ animationDelay: `${index * 0.05}s` }}>
                    <td className={styles.partenaireName}>
                      <span className={styles.partenaireDot}></span>
                      {erreur.partenaireNom}
                    </td>
                    <td className={styles.reference}>{erreur.dossierReference}</td>
                    <td style={{ fontWeight: '800', color: '#64748b' }}>{new Date(erreur.dateDetection).toLocaleDateString()}</td>
                    <td style={{ fontWeight: '800' }}>{erreur.technicienNomComplet}</td>
                    
                    {/* 🚀 AFFICHER LA CATÉGORIE EN PILLULE */}
                    <td>
                      <span className={styles.categorieBadge}>
                        {erreur.categorie || 'Non Catégorisée'}
                      </span>
                    </td>
                    
                    <td style={{ color: '#475569', fontWeight: '700' }}>{erreur.regleDescription}</td>
                    
                    <td className={styles.impact}>{erreur.impactEstime} €</td>
                    <td>
                      <span className={`${styles.badge} ${styles[erreur.statut.toLowerCase()] || styles.badge_default}`}>
                        {erreur.statut.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <Link href={`/erreurs/${erreur.id}`} className={styles.actionBtn}>
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))}
                {paginatedErreurs.length === 0 && (
                  <tr>
                    <td colSpan={9} className={styles.empty}>Le registre est vide pour ce filtre.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className={styles.paginationWrapper}>
            <span className={styles.pageInfo}>
              Affichage {((currentPage - 1) * ITEMS_PER_PAGE) + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, totalErreurs)} sur {totalErreurs}
            </span>
            <div className={styles.pageControls}>
              <button 
                className={styles.pageBtn} 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                &lt;
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <button 
                      key={page}
                      className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                }
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} style={{ color: '#94a3b8', padding: '0 5px' }}>...</span>;
                }
                return null;
              })}

              <button 
                className={styles.pageBtn} 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                &gt;
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}