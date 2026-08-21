"use client";

import { useState, useEffect } from 'react';
import { getKpiGlobalAdmin, getAdminPartenaires, getAdminCqData, getContestationsCount } from '@/services/apiService';
import { KpiArchiveDTO, PartenaireDTO } from '@/types/api';
import InteractiveCard from './components/InteractiveCard/InteractiveCard';
import StatCard from './components/StatCard/StatCard';
import TrendChart from './components/TrendChart/TrendChart';
import PenaltyPipeline from './components/PenaltyPipeline/PenaltyPipeline';
import CustomSelect from './components/CustomSelect/CustomSelect';
import styles from './VueGlobale.module.css';

const CQ_TABS = ["Audits tech", "Check-voisinage", "Expertises SAV", "Taux de coupures"];

export default function VueGlobalePage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDept, setSelectedDept] = useState("GLOBAL");
  
  const [visionMode, setVisionMode] = useState<'ADMIN' | 'PARTENAIRE'>('ADMIN');
  
  const [data, setData] = useState<KpiArchiveDTO[]>([]);
  const [partenaires, setPartenaires] = useState<PartenaireDTO[]>([]);
  const [departments, setDepartments] = useState<string[]>(["GLOBAL"]);
  const [loading, setLoading] = useState(false);

  const [chartDataRacc, setChartDataRacc] = useState<number[]>([]);
  const [chartDataSav, setChartDataSav] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  const [totalCqPenalties, setTotalCqPenalties] = useState<number>(0);
  const [contestationsCount, setContestationsCount] = useState<number>(0);

  useEffect(() => {
    getAdminPartenaires().then(setPartenaires).catch(console.error);
  }, []);

  const fetchTrendData = async (currentMonth: number, currentYear: number) => {
    setChartLoading(true);
    try {
      const labels = [];
      const promises = [];

      for (let i = 5; i >= 0; i--) {
        let m = currentMonth - i;
        let y = currentYear;
        if (m <= 0) { m += 12; y -= 1; }
        const date = new Date(y, m - 1);
        labels.push(date.toLocaleString('fr-FR', { month: 'short' }).charAt(0).toUpperCase() + date.toLocaleString('fr-FR', { month: 'short' }).slice(1) + '.');
        promises.push(getKpiGlobalAdmin(m, y));
      }

      const results = await Promise.all(promises);
      const raccScores: number[] = [];
      const savScores: number[] = [];

      results.forEach(monthData => {
        if (!monthData || monthData.length === 0) {
          raccScores.push(0); savScores.push(0); return;
        }
        const raccProcessus = ["SACLI_OK", "SARCLI_NOK", "GEM_NOK", "TAUX_20J", "ZMD_AMII", "ZMD_RIP", "ZTD", "TNH", "PERF_RANG_1_A", "PERF_RANG_1_B", "PERF_RANG_1_C", "HOTLINE_RANG_1_A", "HOTLINE_RANG_1_B", "HOTLINE_RANG_1_C", "CONSTRUCTION_RANG_1_A", "CONSTRUCTION_RANG_1_B", "CONSTRUCTION_RANG_1_C", "PERF_RANG_2_A", "PERF_RANG_2_B", "PERF_RANG_2_C", "INCOHERENCE_PTO", "CADRAGE", "TAUX_PLAINTE"];
        const rData = monthData.filter(item => raccProcessus.includes(item.processus) && item.departement === "GLOBAL");
        const sData = monthData.filter(item => !raccProcessus.includes(item.processus) && item.departement === "GLOBAL");
        
        raccScores.push(Math.min(100, 90 + rData.reduce((sum, item) => sum + item.bonus, 0)));
        savScores.push(Math.min(100, 90 + sData.reduce((sum, item) => sum + item.bonus, 0)));
      });
      setChartLabels(labels); setChartDataRacc(raccScores); setChartDataSav(savScores);
    } catch (err) {
      console.error(err);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getKpiGlobalAdmin(month, year);
      setData(result);
      
      const depts = new Set<string>();
      result.forEach(item => depts.add(item.departement));
      const sortedDepts = Array.from(depts).sort((a, b) => a === "GLOBAL" ? -1 : b === "GLOBAL" ? 1 : a.localeCompare(b));
      setDepartments(sortedDepts.length > 0 ? sortedDepts : ["GLOBAL"]);
      if (!sortedDepts.includes(selectedDept)) setSelectedDept("GLOBAL");

      const cqPromises = CQ_TABS.map(tab => getAdminCqData(tab, month, year));
      const cqResults = await Promise.all(cqPromises);
      const flatCqData = cqResults.flat();
      
      const calculatedTotal = flatCqData.reduce((sum, row) => sum + (visionMode === 'ADMIN' ? (row.montant || 0) : (row.mtSst || 0)), 0);
      setTotalCqPenalties(calculatedTotal);

      // 🛡️ JDID: Fetch Contestations count
      const count = await getContestationsCount(month, year);
      setContestationsCount(count);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [month, year, visionMode]);
  useEffect(() => { fetchTrendData(month, year); }, [month, year]);

  const filteredData = data.filter(item => item.departement === selectedDept);
  const raccProcessus = ["SACLI_OK", "SARCLI_NOK", "GEM_NOK", "TAUX_20J", "ZMD_AMII", "ZMD_RIP", "ZTD", "TNH", "PERF_RANG_1_A", "PERF_RANG_1_B", "PERF_RANG_1_C", "HOTLINE_RANG_1_A", "HOTLINE_RANG_1_B", "HOTLINE_RANG_1_C", "CONSTRUCTION_RANG_1_A", "CONSTRUCTION_RANG_1_B", "CONSTRUCTION_RANG_1_C", "PERF_RANG_2_A", "PERF_RANG_2_B", "PERF_RANG_2_C", "INCOHERENCE_PTO", "CADRAGE", "TAUX_PLAINTE"];
  
  const totalRaccBonus = filteredData.filter(item => raccProcessus.includes(item.processus)).reduce((sum, item) => sum + item.bonus, 0);
  const totalSavBonus = filteredData.filter(item => !raccProcessus.includes(item.processus)).reduce((sum, item) => sum + item.bonus, 0);

  // 🛡️ JDID: Logique de Mapping et de Groupement (RowSpan)
  function mapProcessus(p: string, domaine: string) {
    if (p.startsWith('PERF_RANG_1_')) return { cat: 'PERF', niv: 'RANG 1', ind: 'PLP', zone: p.split('_')[3] };
    if (p.startsWith('HOTLINE_RANG_1_')) return { cat: 'PERF', niv: 'RANG 1', ind: 'HOTLINE', zone: p.split('_')[3] };
    if (p.startsWith('CONSTRUCTION_RANG_1_')) return { cat: 'PERF', niv: 'RANG 1', ind: 'CONSTRUCTION', zone: p.split('_')[3] };
    if (p.startsWith('PERF_RANG_2_')) return { cat: 'PERF', niv: 'RANG 2', ind: 'RANG 2', zone: p.split('_')[3] };
    if (p === 'TNH') return { cat: 'PERF', niv: 'TNH', ind: 'TNH', zone: 'GLOBAL' };
    
    if (p === 'SACLI_OK') return { cat: 'QUALITE', niv: 'GLOBAL', ind: 'SACLI OK', zone: 'GLOBAL' };
    if (p === 'SARCLI_NOK') return { cat: 'QUALITE', niv: 'GLOBAL', ind: 'SARCLI NOK', zone: 'GLOBAL' };
    if (p === 'TAUX_PLAINTE') return { cat: 'QUALITE', niv: 'GLOBAL', ind: 'TAUX PLAINTE', zone: 'GLOBAL' };
    if (p === 'CCR') return { cat: 'QUALITE', niv: 'GLOBAL', ind: 'CCR', zone: 'GLOBAL' };
    if (p === 'SATCLI_SAV') return { cat: 'QUALITE', niv: 'GLOBAL', ind: 'SATCLI SAV', zone: 'GLOBAL' };

    if (p === 'GEM_NOK') return { cat: 'CONFORMITE', niv: 'GLOBAL', ind: 'GEM NOK', zone: 'GLOBAL' };
    if (p === 'INCOHERENCE_PTO') return { cat: 'CONFORMITE', niv: 'GLOBAL', ind: 'INCOHERENCE PTO', zone: 'GLOBAL' };
    if (p === 'CADRAGE') return { cat: 'CONFORMITE', niv: 'GLOBAL', ind: 'CADRAGE', zone: 'GLOBAL' };

    if (['TAUX_20J', 'ZMD_AMII', 'ZMD_RIP', 'ZTD'].includes(p)) return { cat: 'DELAIS', niv: 'GLOBAL', ind: p, zone: 'GLOBAL' };
    
    if (p === 'SECURISATION') return { cat: 'PERF', niv: 'GLOBAL', ind: 'SECURISATION', zone: 'GLOBAL' };
    if (p === 'TNH_SAV') return { cat: 'PERF', niv: 'GLOBAL', ind: 'TNH SAV', zone: 'GLOBAL' };
    if (p === 'SAV_PERF') return { cat: 'PERF', niv: 'GLOBAL', ind: 'SAV PERF', zone: 'GLOBAL' };

    return { cat: 'AUTRES', niv: 'GLOBAL', ind: p, zone: 'GLOBAL' };
  }

  const mappedData = filteredData.map(item => {
    const domaine = raccProcessus.includes(item.processus) ? 'RACC' : 'SAV';
    return { ...item, domaine, ...mapProcessus(item.processus, domaine) };
  });

  const catOrder = ['PERF', 'QUALITE', 'CONFORMITE', 'DELAIS', 'AUTRES'];
  const nivOrder = ['RANG 1', 'RANG 2', 'TNH', 'GLOBAL'];
  const indOrder = ['PLP', 'HOTLINE', 'CONSTRUCTION', 'RANG 2', 'TNH', 'SACLI OK', 'SARCLI NOK', 'TAUX PLAINTE', 'GEM NOK', 'INCOHERENCE PTO', 'CADRAGE', 'TAUX_20J', 'ZMD_AMII', 'ZMD_RIP', 'ZTD', 'SATCLI SAV', 'SECURISATION', 'TNH SAV', 'CCR', 'SAV PERF'];
  
  mappedData.sort((a, b) => {
    if (a.domaine !== b.domaine) return a.domaine === 'RACC' ? -1 : 1;
    if (a.cat !== b.cat) return catOrder.indexOf(a.cat) - catOrder.indexOf(b.cat);
    if (a.niv !== b.niv) return nivOrder.indexOf(a.niv) - nivOrder.indexOf(b.niv);
    if (a.ind !== b.ind) return indOrder.indexOf(a.ind) - indOrder.indexOf(b.ind);
    return a.zone.localeCompare(b.zone);
  });

  const renderRows: any[] = [];
  const domaines = ['RACC', 'SAV'];
  domaines.forEach(domaine => {
    const dRows = mappedData.filter(r => r.domaine === domaine);
    if (!dRows.length) return;
    
    const categories = Array.from(new Set(dRows.map(r => r.cat)));
    categories.forEach((cat, catIdx) => {
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
              domaineSpan: (catIdx === 0 && nivIdx === 0 && indIdx === 0 && rowIdx === 0) ? dRows.length : 0,
              catSpan: (nivIdx === 0 && indIdx === 0 && rowIdx === 0) ? cRows.length : 0,
              nivSpan: (indIdx === 0 && rowIdx === 0) ? nRows.length : 0,
              indSpan: (rowIdx === 0) ? iRows.length : 0,
            });
          });
        });
      });
    });
  });

  const IconRacc = <svg viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
  const IconSav = <svg viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>;
  const IconAlert = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
  const IconMoney = <svg viewBox="0 0 24 24" fill="none"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;

  const monthOptions = [1,2,3,4,5,6,7,8,9,10,11,12].map(m => ({ value: m, label: `Mois ${m}` }));
  const yearOptions = [2024, 2025, 2026, 2027].map(y => ({ value: y, label: y.toString() }));
  const deptOptions = departments.map(d => ({ value: d, label: d === "GLOBAL" ? "Tous les Départements" : `DPT ${d}` }));

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      <div className={styles.container}>
        
        <header className={styles.header}>
          <div className={styles.titleBox}>
            <h1>Supervision Globale</h1>
            <p>Analyse des performances et suivi des pénalités réseau.</p>
          </div>
          
          <div className={styles.controlsWrapper}>
            <div className={styles.visionToggle}>
              <button 
                className={`${styles.visionBtn} ${visionMode === 'ADMIN' ? styles.activeAdmin : ''}`}
                onClick={() => setVisionMode('ADMIN')}
              >
                Vision Admin (Montant)
              </button>
              <button 
                className={`${styles.visionBtn} ${visionMode === 'PARTENAIRE' ? styles.activePartenaire : ''}`}
                onClick={() => setVisionMode('PARTENAIRE')}
              >
                Vision Partenaire (MT SST)
              </button>
            </div>

            <div className={styles.controls}>
              <CustomSelect value={month} options={monthOptions} onChange={setMonth} width="140px" />
              <CustomSelect value={year} options={yearOptions} onChange={setYear} width="110px" />
              <CustomSelect value={selectedDept} options={deptOptions} onChange={setSelectedDept} width="220px" />
            </div>
          </div>
        </header>

        <div className={styles.topGrid}>
          <InteractiveCard delayIndex={1}>
            <StatCard title="Résultat CQ RACC" value={`${Math.min(100, 90 + totalRaccBonus).toFixed(2)}%`} icon={IconRacc} colorBg="#fef2f2" colorIcon="#ef4444" trend={`+${totalRaccBonus.toFixed(2)}% Bonus`} trendType="positive" />
          </InteractiveCard>
          <InteractiveCard delayIndex={2}>
            <StatCard title="Résultat CQ SAV" value={`${Math.min(100, 90 + totalSavBonus).toFixed(2)}%`} icon={IconSav} colorBg="#ecfdf5" colorIcon="#10b981" trend={`+${totalSavBonus.toFixed(2)}% Bonus`} trendType="positive" />
          </InteractiveCard>
          <InteractiveCard delayIndex={3}>
            <StatCard title="Nombre de Contestations" value={contestationsCount.toString()} icon={IconAlert} colorBg="#fffbeb" colorIcon="#d97706" />
          </InteractiveCard>
          <InteractiveCard delayIndex={4}>
            <StatCard title={`Penalty (Estimatif)`} value={`${totalCqPenalties.toLocaleString('fr-FR')} €`} icon={IconMoney} colorBg="#eff6ff" colorIcon="#3b82f6" />
          </InteractiveCard>
        </div>

        <div className={styles.middleGrid}>
          <InteractiveCard delayIndex={5}>
            <TrendChart dataRacc={chartDataRacc} dataSav={chartDataSav} labels={chartLabels} isLoading={chartLoading} />
          </InteractiveCard>
          
          <InteractiveCard delayIndex={6}>
            <PenaltyPipeline 
              detectees={totalCqPenalties} 
              contestees={Math.floor(totalCqPenalties * 0.4)}
              validees={Math.floor(totalCqPenalties * 0.25)} 
              vision={visionMode}
            />
          </InteractiveCard>
        </div>

        {/* 🚀 LA NOUVELLE TABLE AVEC ROWSPAN (GROUPEMENT) */}
        <div className={styles.tableWrapper}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Chargement des données en temps réel...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Domaine</th>
                  <th>Catégorie</th>
                  <th>Niveau</th>
                  <th>Indicateur</th>
                  <th>Zone/Détail</th>
                  <th>NUM</th>
                  <th>DENUM</th>
                  <th>Résultat Brut</th>
                  <th>Bonus</th>
                </tr>
              </thead>
              <tbody>
                {renderRows.map((row, index) => (
                  <tr key={`${row.id}-${index}`} className={styles.tableRow} style={{ animationDelay: `${0.6 + index * 0.02}s` }}>
                    {row.domaineSpan > 0 && (
                      <td rowSpan={row.domaineSpan} className={styles.groupCellDomaine}>
                        <div className={styles.verticalText}>
                          <span className={row.domaine === 'RACC' ? styles.badgeRacc : styles.badgeSav}>{row.domaine}</span>
                        </div>
                      </td>
                    )}
                    {row.catSpan > 0 && (
                      <td rowSpan={row.catSpan} className={styles.groupCellCat}>{row.cat}</td>
                    )}
                    {row.nivSpan > 0 && (
                      <td rowSpan={row.nivSpan} className={styles.groupCellNiv}>{row.niv}</td>
                    )}
                    {row.indSpan > 0 && (
                      <td rowSpan={row.indSpan} className={styles.groupCellInd}>{row.ind}</td>
                    )}
                    <td><span className={styles.zoneBadge}>{row.zone}</span></td>
                    <td style={{fontWeight: '900', color: '#0f172a'}}>{row.num.toLocaleString()}</td>
                    <td style={{fontWeight: '900', color: '#0f172a'}}>{row.denum.toLocaleString()}</td>
                    <td><span className={styles.badgeSuccess}>{row.resultat}%</span></td>
                    <td><span className={styles.badgeBonus}>{row.bonus > 0 ? '+' : ''}{row.bonus}%</span></td>
                  </tr>
                ))}
                {renderRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className={styles.empty}>Aucune donnée trouvée pour cette période.</td>
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