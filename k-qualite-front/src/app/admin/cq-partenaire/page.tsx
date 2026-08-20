"use client";

import { useEffect, useState, useMemo } from 'react';
import { getAdminCqPartenaire, getAdminPartenaires } from '@/services/apiService';
import { CqPartenaireKpiDTO, PartenaireDTO } from '@/types/api';
// 🚀 L'FIX DES CHEMINS: Relative Paths mriglin 100%
import CustomSelect from '../vue-globale/components/CustomSelect/CustomSelect'; 
import InteractiveCard from '../vue-globale/components/InteractiveCard/InteractiveCard'; 
import styles from './AdminCqPartenaire.module.css';

const ITEMS_PER_PAGE = 8;

export default function AdminCqPartenairePage() {
  const [data, setData] = useState<CqPartenaireKpiDTO[]>([]);
  const [partenaires, setPartenaires] = useState<PartenaireDTO[]>([]);
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedPartenaire, setSelectedPartenaire] = useState("ALL");
  const [loading, setLoading] = useState(false);

  // 🚀 STATE PAGINATION
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [month, year, selectedPartenaire]);

  useEffect(() => {
    getAdminPartenaires().then(setPartenaires).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    getAdminCqPartenaire(month, year, selectedPartenaire === "ALL" ? undefined : selectedPartenaire)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month, year, selectedPartenaire]);

  // 🛡️ L'FIX HWA HNA: Agrégation Globale & Enrichissement TAUX_PLAINTE[cite: 7]
  let displayData = data;
  
  if (selectedPartenaire === "ALL" && data.length > 0) {
    const aggregated: Record<string, CqPartenaireKpiDTO> = {};
    data.forEach(row => {
      const key = `${row.indicateur}-${row.zone}`;
      if (!aggregated[key]) {
        aggregated[key] = { ...row, id: Math.random(), partenaireNom: "VUE GLOBALE (TOUS)", num: 0, denum: 0 };
      }
      aggregated[key].num += row.num;
      aggregated[key].denum += row.denum;
    });
    displayData = Object.values(aggregated);
  }

  displayData = displayData.map(row => {
    if (row.indicateur === 'TAUX_PLAINTE') {
      const f2Denum = displayData
        .filter(d => d.partenaireNom === row.partenaireNom && ['PLP', 'HOTLINE', 'CONSTRUCTION', 'RANG_2'].includes(d.indicateur))
        .reduce((sum, d) => sum + d.denum, 0);
      const res = f2Denum > 0 ? Number(((row.num / f2Denum) * 100).toFixed(2)) : 0;
      return { ...row, denum: f2Denum, resultat: res, isLocked: f2Denum === 0 } as any;
    }
    return row;
  });

  // 🚀 CALCUL DES KPIs EN HAUT
  const totalLignes = displayData.length;
  const avgResult = totalLignes > 0 ? (displayData.reduce((sum, d) => sum + (d.resultat || 0), 0) / totalLignes) : 0;

  // Options pour le CustomSelect Luxe
  const monthOptions = [1,2,3,4,5,6,7,8,9,10,11,12].map(m => ({ value: m, label: `Mois ${m}` }));
  const yearOptions = [2024, 2025, 2026, 2027].map(y => ({ value: y, label: y.toString() }));
  const partenaireOptions = [
    { value: "ALL", label: `Vue Globale (Tous les partenaires)` },
    ...partenaires.map(p => ({ value: p.id.toString(), label: p.nomEntreprise }))
  ];

  // 🚀 LOGIQUE PAGINATION
  const totalPages = Math.ceil(totalLignes / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayData.slice(start, start + ITEMS_PER_PAGE);
  }, [displayData, currentPage]);

  const IconChart = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
  const IconData = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
  const IconTarget = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;

  return (
    <div className={styles.pageWrapper}>
      {/* 🚀 LIQUID BACKGROUND */}
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      <div className={styles.container}>
        
        <header className={styles.header}>
          <div>
            <div className={styles.adminBadge}>MOTEUR D'AGRÉGATION</div>
            <h1>KPIs & Calculs CQ</h1>
            <p>Performances consolidées des fichiers partenaires (F2, SACLI, SARCLI...).</p>
          </div>
          
          <div className={styles.filtersWrapper}>
            <div className={styles.filterLabel}>
              <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Filtrer l'Analyse
            </div>
            <CustomSelect value={month} options={monthOptions} onChange={setMonth} width="140px" />
            <CustomSelect value={year} options={yearOptions} onChange={setYear} width="110px" />
            <CustomSelect value={selectedPartenaire} options={partenaireOptions} onChange={setSelectedPartenaire} width="300px" />
          </div>
        </header>

        {/* 🚀 KPIs CARDS (INTERACTIVE 3D) */}
        <div className={styles.kpiGrid}>
          <InteractiveCard delayIndex={1}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}>{IconData}</div>
                <h3 className={styles.kpiTitle}>Lignes Analysées</h3>
              </div>
              <p className={`${styles.kpiValue} ${styles.valueBlue}`}>{totalLignes.toLocaleString('fr-FR')}</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={2}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#ecfdf5', color: '#10b981' }}>{IconChart}</div>
                <h3 className={styles.kpiTitle}>Moyenne Globale de Réussite</h3>
              </div>
              <p className={`${styles.kpiValue} ${styles.valueGreen}`}>{avgResult.toFixed(2)} %</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={3}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#f8fafc', color: '#475569' }}>{IconTarget}</div>
                <h3 className={styles.kpiTitle}>Entité Cible</h3>
              </div>
              <p className={styles.kpiValue} style={{ fontSize: selectedPartenaire === "ALL" ? '24px' : '32px' }}>
                {selectedPartenaire === "ALL" ? "Tous les partenaires" : partenaires.find(p => p.id.toString() === selectedPartenaire)?.nomEntreprise || "-"}
              </p>
            </div>
          </InteractiveCard>
        </div>

        {/* 🚀 TABLE LUXE M3A PAGINATION */}
        <div className={styles.tableWrapper}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Agrégation mathématique en cours...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Partenaire</th>
                  <th>Indicateur Métrique</th>
                  <th>Zone / Département</th>
                  <th>Numérateur (NUM)</th>
                  <th>Dénominateur (DENUM)</th>
                  <th>Taux de Réussite</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row: any, index) => (
                  <tr key={`${row.id}-${currentPage}`} className={styles.tableRow} style={{ animationDelay: `${index * 0.05}s` }}>
                    <td className={styles.partenaireName}>
                      {row.partenaireNom.includes("GLOBALE") ? (
                         <span className={styles.partenaireDot} style={{ background: '#ef4444', boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }}></span>
                      ) : (
                         <span className={styles.partenaireDot}></span>
                      )}
                      <span style={{ color: row.partenaireNom.includes("GLOBALE") ? '#ef4444' : '#0f172a' }}>
                        {row.partenaireNom}
                      </span>
                    </td>
                    <td><span className={styles.badgeIndicator}>{row.indicateur.replace('_', ' ')}</span></td>
                    <td style={{ fontWeight: '800', color: '#64748b' }}>{row.zone === 'GLOBAL' ? 'National (Global)' : `ZONE ${row.zone}`}</td>
                    <td style={{ fontWeight: '900', fontSize: '15px' }}>{row.num.toLocaleString('fr-FR')}</td>
                    
                    {/* 🛡️ L'FIX HWA HNA: Affichage dyal l'9fel ila kan Fichier 2 mazal mat-injecta */}
                    <td>
                      {row.isLocked 
                        ? <span title="Nécessite l'import du Fichier 2 (PLP...)" style={{ filter: 'grayscale(1)', opacity: 0.5 }}>🔒 Bloqué</span> 
                        : <span style={{ fontWeight: '900', fontSize: '15px' }}>{row.denum.toLocaleString('fr-FR')}</span>
                      }
                    </td>
                    
                    <td>
                      {row.isLocked 
                        ? <span className={styles.badgeLocked}>En attente F2</span> 
                        : <span className={styles.badgeSuccess}>{row.resultat}%</span>}
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={6} className={styles.empty}>Aucune donnée calculée pour cette période.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 🚀 PAGINATION BAR LUXE */}
        {!loading && totalPages > 1 && (
          <div className={styles.paginationWrapper}>
            <span className={styles.pageInfo}>
              Affichage {((currentPage - 1) * ITEMS_PER_PAGE) + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, totalLignes)} sur {totalLignes}
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