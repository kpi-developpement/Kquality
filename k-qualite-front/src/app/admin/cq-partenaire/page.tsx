"use client";

import { useEffect, useState, useMemo } from 'react';
import { getAdminCqPartenaire, getAdminPartenaires } from '@/services/apiService';
import { CqPartenaireKpiDTO, PartenaireDTO } from '@/types/api';
import CustomSelect from '../vue-globale/components/CustomSelect/CustomSelect'; 
import InteractiveCard from '../vue-globale/components/InteractiveCard/InteractiveCard'; 
import styles from './AdminCqPartenaire.module.css';

export default function AdminCqPartenairePage() {
  const [data, setData] = useState<CqPartenaireKpiDTO[]>([]);
  const [partenaires, setPartenaires] = useState<PartenaireDTO[]>([]);
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedPartenaire, setSelectedPartenaire] = useState("ALL");
  const [loading, setLoading] = useState(false);

  useEffect(() => { getAdminPartenaires().then(setPartenaires).catch(console.error); }, []);

  useEffect(() => {
    setLoading(true);
    getAdminCqPartenaire(month, year, selectedPartenaire === "ALL" ? undefined : selectedPartenaire)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month, year, selectedPartenaire]);

  // 🛡️ Agrégation Globale & Enrichissement TAUX_PLAINTE[cite: 7]
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

  // 🚀 GROUPEMENT DES DONNÉES (L'ARBRE)
  const groupedData = useMemo(() => {
    const groups = {
      RANG_1: [] as CqPartenaireKpiDTO[],
      RANG_2: [] as CqPartenaireKpiDTO[],
      QUALITE: [] as CqPartenaireKpiDTO[],
      CONFORMITE: [] as CqPartenaireKpiDTO[],
      AUTRES: [] as CqPartenaireKpiDTO[]
    };

    displayData.forEach(row => {
      const ind = row.indicateur.toUpperCase();
      if (['PLP', 'HOTLINE', 'CONSTRUCTION'].includes(ind) || ind.includes('RANG_1')) {
        groups.RANG_1.push(row);
      } else if (ind.includes('RANG_2')) {
        groups.RANG_2.push(row);
      } else if (['TAUX_PLAINTE', 'SACLI_OK', 'SARCLI_NOK'].includes(ind)) {
        groups.QUALITE.push(row);
      } else if (['GEM_NOK', 'CADRAGE', 'INCOHERENCE_PTO'].includes(ind)) {
        groups.CONFORMITE.push(row);
      } else {
        groups.AUTRES.push(row);
      }
    });

    return groups;
  }, [displayData]);

  // KPIs
  const totalLignes = displayData.length;
  const avgResult = totalLignes > 0 ? (displayData.reduce((sum, d) => sum + (d.resultat || 0), 0) / totalLignes) : 0;
  
  const monthOptions = [1,2,3,4,5,6,7,8,9,10,11,12].map(m => ({ value: m, label: `Mois ${m}` }));
  const yearOptions = [2024, 2025, 2026, 2027].map(y => ({ value: y, label: y.toString() }));
  const partenaireOptions = [
    { value: "ALL", label: `Vue Globale (Tous les partenaires)` },
    ...partenaires.map(p => ({ value: p.id.toString(), label: p.nomEntreprise }))
  ];

  const IconChart = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
  const IconData = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
  const IconTarget = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;

  // Fonction Helper pour dessiner une ligne du tableau
  const renderRow = (row: any, index: number) => (
    <tr key={`${row.id}-${index}`} className={styles.tableRow} style={{ animationDelay: `${index * 0.05}s` }}>
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
      <td><span className={styles.badgeIndicator}>{row.indicateur.replace(/_/g, ' ')}</span></td>
      <td style={{ fontWeight: '800', color: '#64748b' }}>{row.zone === 'GLOBAL' ? 'National (Global)' : `ZONE ${row.zone}`}</td>
      <td style={{ fontWeight: '900', fontSize: '15px' }}>{row.num.toLocaleString('fr-FR')}</td>
      <td>
        {row.isLocked 
          ? <span title="Nécessite l'import du Fichier 2 (PLP...)" style={{ filter: 'grayscale(1)', opacity: 0.6 }}>🔒 Bloqué</span> 
          : <span style={{ fontWeight: '900', fontSize: '15px' }}>{row.denum.toLocaleString('fr-FR')}</span>
        }
      </td>
      <td>
        {row.isLocked 
          ? <span className={styles.badgeLocked}>En attente F2</span> 
          : <span className={styles.badgeSuccess}>{row.resultat}%</span>}
      </td>
    </tr>
  );

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      <div className={styles.container}>
        
        <header className={styles.header}>
          <div>
            <div className={styles.adminBadge}>MOTEUR D'AGRÉGATION</div>
            <h1>KPIs & Scorecard Qualité</h1>
            <p>Vue détaillée et hiérarchisée des performances réseau.</p>
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

        <div className={styles.kpiGrid}>
          <InteractiveCard delayIndex={1}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}>{IconData}</div>
                <h3 className={styles.kpiTitle}>Métriques Traitées</h3>
              </div>
              <p className={`${styles.kpiValue} ${styles.valueBlue}`}>{totalLignes.toLocaleString('fr-FR')}</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={2}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#ecfdf5', color: '#10b981' }}>{IconChart}</div>
                <h3 className={styles.kpiTitle}>Moyenne de Réussite</h3>
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

        {/* 🚀 SCORECARD ARBORESCENTE */}
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
                
                {/* 🚀 SECTION 1 : PERFORMANCE GLOBALE */}
                {(groupedData.RANG_1.length > 0 || groupedData.RANG_2.length > 0) && (
                  <tr className={styles.mainCategoryRow}>
                    <td colSpan={6}>
                      <div className={styles.mainCategoryTitle}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                        Performance Opérationnelle (RACC & SAV)
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* SOUS-SECTION: RANG 1 */}
                {groupedData.RANG_1.length > 0 && (
                  <>
                    <tr className={styles.subCategoryRow}>
                      <td colSpan={6}>
                        <div className={styles.subCategoryTitle}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                          Niveau : Rang 1 (PLP, Hotline, Construction)
                        </div>
                      </td>
                    </tr>
                    {groupedData.RANG_1.map((row, i) => renderRow(row, i))}
                  </>
                )}

                {/* SOUS-SECTION: RANG 2 */}
                {groupedData.RANG_2.length > 0 && (
                  <>
                    <tr className={styles.subCategoryRow}>
                      <td colSpan={6}>
                        <div className={styles.subCategoryTitle}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          Niveau : Rang 2
                        </div>
                      </td>
                    </tr>
                    {groupedData.RANG_2.map((row, i) => renderRow(row, i))}
                  </>
                )}

                {/* 🚀 SECTION 2 : QUALITÉ CLIENT */}
                {groupedData.QUALITE.length > 0 && (
                  <>
                    <tr className={styles.mainCategoryRow}>
                      <td colSpan={6}>
                        <div className={styles.mainCategoryTitle}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                          Qualité & Satisfaction Client
                        </div>
                      </td>
                    </tr>
                    {groupedData.QUALITE.map((row, i) => renderRow(row, i))}
                  </>
                )}

                {/* 🚀 SECTION 3 : CONFORMITÉ */}
                {groupedData.CONFORMITE.length > 0 && (
                  <>
                    <tr className={styles.mainCategoryRow}>
                      <td colSpan={6}>
                        <div className={styles.mainCategoryTitle}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                          Conformité & Contrôles
                        </div>
                      </td>
                    </tr>
                    {groupedData.CONFORMITE.map((row, i) => renderRow(row, i))}
                  </>
                )}

                {/* 🚀 SECTION 4 : AUTRES */}
                {groupedData.AUTRES.length > 0 && (
                  <>
                    <tr className={styles.mainCategoryRow}>
                      <td colSpan={6}>
                        <div className={styles.mainCategoryTitle}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                          Autres Indicateurs
                        </div>
                      </td>
                    </tr>
                    {groupedData.AUTRES.map((row, i) => renderRow(row, i))}
                  </>
                )}

                {displayData.length === 0 && (
                  <tr>
                    <td colSpan={6} className={styles.empty}>Aucune donnée calculée pour cette période.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}