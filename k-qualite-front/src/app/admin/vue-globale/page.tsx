"use client";

import { useState, useEffect } from 'react';
import { getKpiGlobalAdmin, getAdminPartenaires, getAdminCqData } from '@/services/apiService';
import { KpiArchiveDTO, PartenaireDTO, CqDataDTO } from '@/types/api';
import InteractiveCard from './components/InteractiveCard/InteractiveCard';
import StatCard from './components/StatCard/StatCard';
import TrendChart from './components/TrendChart/TrendChart';
import PenaltyPipeline from './components/PenaltyPipeline/PenaltyPipeline';
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
  const raccData = filteredData.filter(item => raccProcessus.includes(item.processus));
  const savData = filteredData.filter(item => !raccProcessus.includes(item.processus));

  const totalRaccBonus = raccData.reduce((sum, item) => sum + item.bonus, 0);
  const totalSavBonus = savData.reduce((sum, item) => sum + item.bonus, 0);
  const finalScore = data.length > 0 ? Math.min(100, 90 + totalRaccBonus + totalSavBonus) : 0;

  const IconRacc = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
  const IconSav = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>;
  const IconScore = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
  const IconMoney = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>
      <div className={styles.bgBlob3}></div>

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
              {/* 🚀 L'FIX DES DROPDOWNS: selectWrapper bach yt7kem f l'fleche SVG Custom */}
              <div className={styles.selectWrapper}>
                <select className={styles.select} value={month} onChange={e => setMonth(Number(e.target.value))}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Mois {m}</option>)}
                </select>
              </div>
              <div className={styles.selectWrapper}>
                <select className={styles.select} value={year} onChange={e => setYear(Number(e.target.value))}>
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className={styles.selectWrapper}>
                <select className={styles.select} value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                  {departments.map(d => <option key={d} value={d}>{d === "GLOBAL" ? "Tous les Départements" : `DPT ${d}`}</option>)}
                </select>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.topGrid}>
          <InteractiveCard delayIndex={1}>
            <StatCard title="Bonus RACC Cumulé" value={`+${totalRaccBonus.toFixed(2)}%`} icon={IconRacc} colorBg="#fef2f2" colorIcon="#ef4444" trend="Stable" />
          </InteractiveCard>
          <InteractiveCard delayIndex={2}>
            <StatCard title="Bonus SAV Cumulé" value={`+${totalSavBonus.toFixed(2)}%`} icon={IconSav} colorBg="#ecfdf5" colorIcon="#10b981" trend="+1.2%" trendType="positive" />
          </InteractiveCard>
          <InteractiveCard delayIndex={3}>
            <StatCard title="Score Global (Base 90%)" value={`${finalScore.toFixed(2)}%`} icon={IconScore} colorBg="#fffbeb" colorIcon="#d97706" />
          </InteractiveCard>
          <InteractiveCard delayIndex={4}>
            <StatCard title={`Pénalités Évitées (${visionMode})`} value={`${totalCqPenalties.toLocaleString('fr-FR')} €`} icon={IconMoney} colorBg="#eff6ff" colorIcon="#3b82f6" />
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

        <div className={styles.tableWrapper}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Chargement des données en temps réel...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Domaine</th>
                  <th>Indicateur Métrique</th>
                  <th>NUM</th>
                  <th>DENUM</th>
                  <th>Performance Brut</th>
                  <th>Bonus Consolidé</th>
                </tr>
              </thead>
              <tbody>
                {raccData.map((item, index) => (
                  <tr key={item.id} className={styles.tableRow} style={{ animationDelay: `${0.6 + index * 0.05}s` }}>
                    <td><span style={{color:'#ef4444', fontWeight:'900'}}>RACC</span></td>
                    <td style={{fontWeight:'800', color:'#0f172a'}}>{item.processus.replace(/_/g, ' ')}</td>
                    <td>{item.num.toLocaleString()}</td>
                    <td>{item.denum.toLocaleString()}</td>
                    <td><span className={styles.badgeSuccess}>{item.resultat}%</span></td>
                    <td><span className={styles.badgeBonus}>+{item.bonus}%</span></td>
                  </tr>
                ))}
                {savData.map((item, index) => (
                  <tr key={item.id} className={styles.tableRow} style={{ animationDelay: `${0.6 + (raccData.length + index) * 0.05}s` }}>
                    <td><span style={{color:'#10b981', fontWeight:'900'}}>SAV</span></td>
                    <td style={{fontWeight:'800', color:'#0f172a'}}>{item.processus.replace(/_/g, ' ')}</td>
                    <td>{item.num.toLocaleString()}</td>
                    <td>{item.denum.toLocaleString()}</td>
                    <td><span className={styles.badgeSuccess}>{item.resultat}%</span></td>
                    <td><span className={styles.badgeBonus}>+{item.bonus}%</span></td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={6} className={styles.empty}>Aucune donnée trouvée pour cette période.</td>
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