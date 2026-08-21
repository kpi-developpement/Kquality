"use client";

import { useEffect, useState } from 'react';
import { getPartenaireCqKpis } from '@/services/apiService';
import { CqPartenaireKpiDTO } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import CustomSelect from '../admin/vue-globale/components/CustomSelect/CustomSelect'; 
import InteractiveCard from '../admin/vue-globale/components/InteractiveCard/InteractiveCard'; 
import styles from './CqPartenaire.module.css';

export default function CqPartenairePage() {
  const { user } = useAuth();
  const [data, setData] = useState<CqPartenaireKpiDTO[]>([]);
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.partenaireId) {
      setLoading(true);
      getPartenaireCqKpis(user.partenaireId, month, year)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, month, year]);

  let displayData = data.map(row => {
    if (row.indicateur === 'TAUX_PLAINTE') {
      const f2Denum = data
        .filter(d => ['PLP', 'HOTLINE', 'CONSTRUCTION', 'RANG_2'].includes(d.indicateur))
        .reduce((sum, d) => sum + d.denum, 0);
      const res = f2Denum > 0 ? Number(((row.num / f2Denum) * 100).toFixed(2)) : 0;
      return { ...row, denum: f2Denum, resultat: res, isLocked: f2Denum === 0 } as any;
    }
    return row;
  });

  function mapProcessus(ind: string) {
    const i = ind.toUpperCase();
    if (['PLP', 'HOTLINE', 'CONSTRUCTION'].includes(i)) return { domaine: 'RACC', cat: 'PERF', niv: 'RANG 1', ind: i };
    if (i === 'RANG_2') return { domaine: 'RACC', cat: 'PERF', niv: 'RANG 2', ind: 'RANG 2' };
    if (i === 'TNH') return { domaine: 'RACC', cat: 'PERF', niv: 'TNH', ind: 'TNH' };
    
    if (['SACLI', 'SARCLI', 'TAUX_PLAINTE'].includes(i)) return { domaine: 'RACC', cat: 'QUALITE', niv: 'GLOBAL', ind: i.replace('_', ' ') };
    if (['GEM_NOK', 'INCOHERENCE_PTO', 'CADRAGE'].includes(i)) return { domaine: 'RACC', cat: 'CONFORMITE', niv: 'GLOBAL', ind: i.replace('_', ' ') };
    
    if (['SATCLI_SAV', 'CCR'].includes(i)) return { domaine: 'SAV', cat: 'QUALITE', niv: 'GLOBAL', ind: i.replace('_', ' ') };
    if (['SECURISATION', 'TNH_SAV', 'SAV_PERF'].includes(i)) return { domaine: 'SAV', cat: 'PERF', niv: 'GLOBAL', ind: i.replace('_', ' ') };

    return { domaine: 'AUTRES', cat: 'AUTRES', niv: 'GLOBAL', ind: i };
  }

  const mappedData = displayData.map(item => ({ ...item, ...mapProcessus(item.indicateur) }));

  const catOrder = ['PERF', 'QUALITE', 'CONFORMITE', 'AUTRES'];
  const nivOrder = ['RANG 1', 'RANG 2', 'TNH', 'GLOBAL'];
  const indOrder = ['PLP', 'HOTLINE', 'CONSTRUCTION', 'RANG 2', 'TNH', 'SACLI', 'SARCLI', 'TAUX PLAINTE', 'GEM NOK', 'INCOHERENCE PTO', 'CADRAGE', 'SATCLI SAV', 'SECURISATION', 'TNH SAV', 'CCR', 'SAV PERF'];
  
  mappedData.sort((a, b) => {
    if (a.domaine !== b.domaine) return a.domaine === 'RACC' ? -1 : 1;
    if (a.cat !== b.cat) return catOrder.indexOf(a.cat) - catOrder.indexOf(b.cat);
    if (a.niv !== b.niv) return nivOrder.indexOf(a.niv) - nivOrder.indexOf(b.niv);
    if (a.ind !== b.ind) return indOrder.indexOf(a.ind) - indOrder.indexOf(b.ind);
    return a.zone.localeCompare(b.zone);
  });

  // 🚀 Helper pour générer les lignes avec RowSpan (SANS LA COLONNE DOMAINE)
  const generateRowsForDomaine = (domaine: string) => {
    const dRows = mappedData.filter(r => r.domaine === domaine);
    const renderRows: any[] = [];
    
    const categories = Array.from(new Set(dRows.map(r => r.cat)));
    categories.forEach((cat) => {
      const cRows = dRows.filter(r => r.cat === cat);
      const niveaux = Array.from(new Set(cRows.map(r => r.niv)));
      
      niveaux.forEach((niv, nivIdx) => {
        const nRows = cRows.filter(r => r.niv === niv);
        const indicateurs = Array.from(new Set(nRows.map(r => r.ind)));
        
        indicateurs.forEach((ind, indIdx) => {
          const iRows = nRows.filter(r => r.ind === ind);
          
          iRows.forEach((row, rowIdx) => {
            renderRows.push({
              ...row,
              catSpan: (nivIdx === 0 && indIdx === 0 && rowIdx === 0) ? cRows.length : 0,
              nivSpan: (indIdx === 0 && rowIdx === 0) ? nRows.length : 0,
              indSpan: (rowIdx === 0) ? iRows.length : 0,
            });
          });
        });
      });
    });
    return renderRows;
  };

  const raccRows = generateRowsForDomaine('RACC');
  const savRows = generateRowsForDomaine('SAV');

  const getGaugeColor = (resultat: number, isNokIndicator: boolean = false) => {
    if (isNokIndicator) {
      if (resultat < 5) return '#10b981';
      if (resultat < 10) return '#f59e0b';
      return '#ef4444';
    }
    if (resultat >= 90) return '#10b981';
    if (resultat >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const totalLignes = displayData.length;
  const avgResult = totalLignes > 0 ? (displayData.reduce((sum, d) => sum + (d.resultat || 0), 0) / totalLignes) : 0;

  const monthOptions = [1,2,3,4,5,6,7,8,9,10,11,12].map(m => ({ value: m, label: `Mois ${m}` }));
  const yearOptions = [2024, 2025, 2026, 2027].map(y => ({ value: y, label: y.toString() }));

  const IconChart = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
  const IconData = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
  const IconTarget = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;
  const IconRacc = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
  const IconSav = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      <div className={styles.container}>
        
        <header className={styles.header}>
          <div className={styles.titleBox}>
            <div className={styles.partnerBadge}>PORTAIL QUALITÉ</div>
            <h1>Indicateurs CQ</h1>
            <p>Vos performances consolidées (Fichier 2, SACLI, SARCLI...).</p>
          </div>
          
          <div className={styles.filtersWrapper}>
            <div className={styles.filterLabel}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Période
            </div>
            <CustomSelect value={month} options={monthOptions} onChange={setMonth} width="140px" />
            <CustomSelect value={year} options={yearOptions} onChange={setYear} width="110px" />
          </div>
        </header>

        <div className={styles.kpiGrid}>
          <InteractiveCard delayIndex={1}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}>{IconData}</div>
                <h3 className={styles.kpiTitle}>Métriques Traitées</h3>
              </div>
              <p className={styles.kpiValue} style={{ color: '#3b82f6' }}>{totalLignes.toLocaleString('fr-FR')}</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={2}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#ecfdf5', color: '#10b981' }}>{IconChart}</div>
                <h3 className={styles.kpiTitle}>Moyenne de Réussite</h3>
              </div>
              <p className={styles.kpiValue} style={{ color: '#10b981' }}>{avgResult.toFixed(2)} %</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={3}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#f8fafc', color: '#475569' }}>{IconTarget}</div>
                <h3 className={styles.kpiTitle}>Entité</h3>
              </div>
              <p className={styles.kpiValue} style={{ fontSize: '24px' }}>
                {user?.email.split('@')[0].toUpperCase()}
              </p>
            </div>
          </InteractiveCard>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Agrégation mathématique en cours...</div>
        ) : (
          <>
            {/* 🔴 TABLEAU RACC */}
            <div className={styles.domainSection}>
              <div className={`${styles.domainHeader} ${styles.domainHeaderRacc}`}>
                <div className={`${styles.domainIcon} ${styles.iconRacc}`}>{IconRacc}</div>
                <h2>RACC - Déploiement & Raccordement</h2>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{width: '15%'}}>Catégorie</th>
                      <th style={{width: '15%'}}>Niveau</th>
                      <th style={{width: '20%'}}>Indicateur</th>
                      <th style={{width: '10%'}}>Zone</th>
                      <th style={{width: '8%'}}>NUM</th>
                      <th style={{width: '8%'}}>DENUM</th>
                      <th style={{width: '24%'}}>Résultat Brut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raccRows.map((row, index) => {
                      const isNok = ['SARCLI', 'TAUX PLAINTE', 'GEM NOK', 'INCOHERENCE PTO'].includes(row.ind);
                      return (
                        <tr key={`racc-${row.id}-${index}`} className={styles.tableRow} style={{ animationDelay: `${0.1 + index * 0.02}s` }}>
                          {row.catSpan > 0 && <td rowSpan={row.catSpan} className={styles.groupCellCat}>{row.cat}</td>}
                          {row.nivSpan > 0 && <td rowSpan={row.nivSpan} className={styles.groupCellNiv}>{row.niv}</td>}
                          {row.indSpan > 0 && <td rowSpan={row.indSpan} className={styles.groupCellInd}>{row.ind}</td>}
                          <td><span className={styles.zoneBadge}>{row.zone}</span></td>
                          <td style={{fontWeight: '900', color: '#0f172a'}}>{row.num.toLocaleString()}</td>
                          
                          <td>
                            {row.isLocked 
                              ? <span title="Nécessite l'import du Fichier 2" style={{ filter: 'grayscale(1)', opacity: 0.6 }}>🔒</span> 
                              : <span style={{ fontWeight: '900', color: '#0f172a' }}>{row.denum.toLocaleString()}</span>
                            }
                          </td>
                          
                          <td>
                            {row.isLocked ? (
                              <span className={styles.badgeLocked}>En attente F2</span>
                            ) : (
                              <div className={styles.gaugeContainer}>
                                <div className={styles.gaugeTrack}>
                                  <div 
                                    className={styles.gaugeFill} 
                                    style={{ width: `${Math.min(row.resultat, 100)}%`, background: getGaugeColor(row.resultat, isNok) }}
                                  />
                                </div>
                                <span className={styles.gaugeText} style={{ color: getGaugeColor(row.resultat, isNok) }}>{row.resultat}%</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {raccRows.length === 0 && <tr><td colSpan={7} className={styles.empty}>Aucune donnée RACC trouvée pour cette période.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 🟢 TABLEAU SAV */}
            <div className={styles.domainSection}>
              <div className={`${styles.domainHeader} ${styles.domainHeaderSav}`}>
                <div className={`${styles.domainIcon} ${styles.iconSav}`}>{IconSav}</div>
                <h2>SAV - Service Après Vente</h2>
              </div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{width: '15%'}}>Catégorie</th>
                      <th style={{width: '15%'}}>Niveau</th>
                      <th style={{width: '20%'}}>Indicateur</th>
                      <th style={{width: '10%'}}>Zone</th>
                      <th style={{width: '8%'}}>NUM</th>
                      <th style={{width: '8%'}}>DENUM</th>
                      <th style={{width: '24%'}}>Résultat Brut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savRows.map((row, index) => {
                      const isNok = false;
                      return (
                        <tr key={`sav-${row.id}-${index}`} className={styles.tableRow} style={{ animationDelay: `${0.1 + index * 0.02}s` }}>
                          {row.catSpan > 0 && <td rowSpan={row.catSpan} className={styles.groupCellCat}>{row.cat}</td>}
                          {row.nivSpan > 0 && <td rowSpan={row.nivSpan} className={styles.groupCellNiv}>{row.niv}</td>}
                          {row.indSpan > 0 && <td rowSpan={row.indSpan} className={styles.groupCellInd}>{row.ind}</td>}
                          <td><span className={styles.zoneBadge}>{row.zone}</span></td>
                          <td style={{fontWeight: '900', color: '#0f172a'}}>{row.num.toLocaleString()}</td>
                          <td style={{fontWeight: '900', color: '#0f172a'}}>{row.denum.toLocaleString()}</td>
                          <td>
                            <div className={styles.gaugeContainer}>
                              <div className={styles.gaugeTrack}>
                                <div 
                                  className={styles.gaugeFill} 
                                  style={{ width: `${Math.min(row.resultat, 100)}%`, background: getGaugeColor(row.resultat, isNok) }}
                                />
                              </div>
                              <span className={styles.gaugeText} style={{ color: getGaugeColor(row.resultat, isNok) }}>{row.resultat}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {savRows.length === 0 && <tr><td colSpan={7} className={styles.empty}>Aucune donnée SAV trouvée pour cette période.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}