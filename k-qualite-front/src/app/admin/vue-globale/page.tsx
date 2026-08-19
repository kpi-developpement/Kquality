"use client";

import { useState, useEffect } from 'react';
import { getKpiGlobalAdmin, getAdminPartenaires } from '@/services/apiService';
import { KpiArchiveDTO, PartenaireDTO } from '@/types/api';
import InteractiveCard from './components/InteractiveCard/InteractiveCard';
import StatCard from './components/StatCard/StatCard';
import TrendChart from './components/TrendChart/TrendChart';
import PenaltyPipeline from './components/PenaltyPipeline/PenaltyPipeline';
import styles from './VueGlobale.module.css';

export default function VueGlobalePage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDept, setSelectedDept] = useState("GLOBAL");
  
  const [data, setData] = useState<KpiArchiveDTO[]>([]);
  const [partenaires, setPartenaires] = useState<PartenaireDTO[]>([]);
  const [departments, setDepartments] = useState<string[]>(["GLOBAL"]);
  const [loading, setLoading] = useState(false);

  // States pour le graphique dynamique à 2 lignes (RACC & SAV)
  const [chartDataRacc, setChartDataRacc] = useState<number[]>([]);
  const [chartDataSav, setChartDataSav] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

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
          raccScores.push(0);
          savScores.push(0);
          return;
        }
        
        const raccProcessus = ["SACLI_OK", "SARCLI_NOK", "GEM_NOK", "TAUX_20J", "ZMD_AMII", "ZMD_RIP", "ZTD", "TNH", "PERF_RANG_1_A", "PERF_RANG_1_B", "PERF_RANG_1_C", "HOTLINE_RANG_1_A", "HOTLINE_RANG_1_B", "HOTLINE_RANG_1_C", "CONSTRUCTION_RANG_1_A", "CONSTRUCTION_RANG_1_B", "CONSTRUCTION_RANG_1_C", "PERF_RANG_2_A", "PERF_RANG_2_B", "PERF_RANG_2_C", "INCOHERENCE_PTO", "CADRAGE", "TAUX_PLAINTE"];
        
        const rData = monthData.filter(item => raccProcessus.includes(item.processus) && item.departement === "GLOBAL");
        const sData = monthData.filter(item => !raccProcessus.includes(item.processus) && item.departement === "GLOBAL");
        
        // Base 90 + Bonus (Max 100)
        raccScores.push(Math.min(100, 90 + rData.reduce((sum, item) => sum + item.bonus, 0)));
        savScores.push(Math.min(100, 90 + sData.reduce((sum, item) => sum + item.bonus, 0)));
      });

      setChartLabels(labels);
      setChartDataRacc(raccScores);
      setChartDataSav(savScores);
    } catch (err) {
      console.error("Erreur Trend:", err);
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

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    fetchTrendData(month, year);
  }, [month, year]);

  const filteredData = data.filter(item => item.departement === selectedDept);

  const raccProcessus = ["SACLI_OK", "SARCLI_NOK", "GEM_NOK", "TAUX_20J", "ZMD_AMII", "ZMD_RIP", "ZTD", "TNH", "PERF_RANG_1_A", "PERF_RANG_1_B", "PERF_RANG_1_C", "HOTLINE_RANG_1_A", "HOTLINE_RANG_1_B", "HOTLINE_RANG_1_C", "CONSTRUCTION_RANG_1_A", "CONSTRUCTION_RANG_1_B", "CONSTRUCTION_RANG_1_C", "PERF_RANG_2_A", "PERF_RANG_2_B", "PERF_RANG_2_C", "INCOHERENCE_PTO", "CADRAGE", "TAUX_PLAINTE"];
  const raccData = filteredData.filter(item => raccProcessus.includes(item.processus));
  const savData = filteredData.filter(item => !raccProcessus.includes(item.processus));

  const totalRaccBonus = raccData.reduce((sum, item) => sum + item.bonus, 0);
  const totalSavBonus = savData.reduce((sum, item) => sum + item.bonus, 0);
  const finalScore = data.length > 0 ? Math.min(100, 90 + totalRaccBonus + totalSavBonus) : 0;

  const IconRacc = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
  const IconSav = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>;
  const IconScore = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
  const IconMoney = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;

  return (
    <div className={styles.pageWrapper}>
      {/* L3IBAT BLEZREQ HNA */}
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>
      <div className={styles.bgBlob3}></div>

      <div className={styles.container}>
        
        <header className={styles.header}>
          <div className={styles.titleBox}>
            <h1>Supervision Globale</h1>
            <p>Analyse des performances et suivi des pénalités réseau.</p>
          </div>
          
          <div className={styles.controls}>
            <select className={styles.select} value={month} onChange={e => setMonth(Number(e.target.value))}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Mois {m}</option>)}
            </select>
            <select className={styles.select} value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className={styles.select} value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
              {departments.map(d => <option key={d} value={d}>{d === "GLOBAL" ? "Tous les Départements" : `DPT ${d}`}</option>)}
            </select>
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
            <StatCard title="Pénalités Évitées" value="14 500 €" icon={IconMoney} colorBg="#eff6ff" colorIcon="#3b82f6" />
          </InteractiveCard>
        </div>

        <div className={styles.middleGrid}>
          <InteractiveCard delayIndex={5}>
            <TrendChart dataRacc={chartDataRacc} dataSav={chartDataSav} labels={chartLabels} isLoading={chartLoading} />
          </InteractiveCard>
          
          <InteractiveCard delayIndex={6}>
            <PenaltyPipeline detectees={24500} contestees={10000} validees={7316} />
          </InteractiveCard>
        </div>

        <div className={styles.tableWrapper}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Chargement des données...</div>
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
                {raccData.map(item => (
                  <tr key={item.id}>
                    <td><span style={{color:'#ef4444', fontWeight:'800'}}>RACC</span></td>
                    <td style={{fontWeight:'700', color:'#0f172a'}}>{item.processus.replace(/_/g, ' ')}</td>
                    <td>{item.num.toLocaleString()}</td>
                    <td>{item.denum.toLocaleString()}</td>
                    <td><span className={styles.badgeSuccess}>{item.resultat}%</span></td>
                    <td><span className={styles.badgeBonus}>+{item.bonus}%</span></td>
                  </tr>
                ))}
                {savData.map(item => (
                  <tr key={item.id}>
                    <td><span style={{color:'#10b981', fontWeight:'800'}}>SAV</span></td>
                    <td style={{fontWeight:'700', color:'#0f172a'}}>{item.processus.replace(/_/g, ' ')}</td>
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