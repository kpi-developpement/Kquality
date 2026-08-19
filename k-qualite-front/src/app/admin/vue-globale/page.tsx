"use client";

import { useState, useEffect } from 'react';
import { getKpiGlobalAdmin, getAdminPartenaires } from '@/services/apiService';
import { KpiArchiveDTO, PartenaireDTO } from '@/types/api';
import CyberCard from './components/CyberCard/CyberCard';
import HoloChart from './components/HoloChart/HoloChart';
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

  useEffect(() => {
    getAdminPartenaires().then(setPartenaires).catch(console.error);
  }, []);

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

  useEffect(() => { fetchData(); }, [month, year]);

  const filteredData = data.filter(item => item.departement === selectedDept);

  // --- SÉPARATION RACC / SAV ---
  const raccProcessus = ["SACLI_OK", "SARCLI_NOK", "GEM_NOK", "TAUX_20J", "ZMD_AMII", "ZMD_RIP", "ZTD", "TNH", "PERF_RANG_1_A", "PERF_RANG_1_B", "PERF_RANG_1_C", "HOTLINE_RANG_1_A", "HOTLINE_RANG_1_B", "HOTLINE_RANG_1_C", "CONSTRUCTION_RANG_1_A", "CONSTRUCTION_RANG_1_B", "CONSTRUCTION_RANG_1_C", "PERF_RANG_2_A", "PERF_RANG_2_B", "PERF_RANG_2_C", "INCOHERENCE_PTO", "CADRAGE", "TAUX_PLAINTE"];
  
  const raccData = filteredData.filter(item => raccProcessus.includes(item.processus));
  const savData = filteredData.filter(item => !raccProcessus.includes(item.processus));

  const totalRaccBonus = raccData.reduce((sum, item) => sum + item.bonus, 0);
  const totalSavBonus = savData.reduce((sum, item) => sum + item.bonus, 0);
  const finalScore = 90 + totalRaccBonus + totalSavBonus;

  // Mock data for the chart (Trend of the last 6 months)
  const chartData = [85, 88, 87, 92, 90, finalScore];
  const chartLabels = ["Mar", "Avr", "Mai", "Juin", "Juil", "Août"];

  const IconRacc = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
  const IconSav = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>;
  const IconScore = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
  const IconMoney = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        
        <header className={styles.header}>
          <div className={styles.titleBox}>
            <h1>Command Center</h1>
            <p>Supervision globale des performances et pénalités réseau.</p>
          </div>
          
          <div className={styles.controls}>
            <select className={styles.select} value={month} onChange={e => setMonth(Number(e.target.value))}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Mois {m}</option>)}
            </select>
            <select className={styles.select} value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className={styles.select} value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
              {departments.map(d => <option key={d} value={d}>{d === "GLOBAL" ? "Tous les DPT" : `DPT ${d}`}</option>)}
            </select>
          </div>
        </header>

        {/* --- ROW 1: CYBER CARDS --- */}
        <div className={styles.topGrid}>
          <CyberCard title="Bonus RACC Cumulé" value={`+${totalRaccBonus.toFixed(2)}%`} icon={IconRacc} color="rgba(56, 189, 248, 1)" trend="Stable" />
          <CyberCard title="Bonus SAV Cumulé" value={`+${totalSavBonus.toFixed(2)}%`} icon={IconSav} color="rgba(16, 185, 129, 1)" trend="+1.2%" />
          <CyberCard title="Score Global (Base 90%)" value={`${finalScore.toFixed(2)}%`} icon={IconScore} color="rgba(245, 158, 11, 1)" trend="Objectif Atteint" />
          <CyberCard title="Pénalités Évitées" value="14 500 €" icon={IconMoney} color="rgba(239, 68, 68, 1)" trend="-5% vs M-1" />
        </div>

        {/* --- ROW 2: CHARTS & PIPELINE --- */}
        <div className={styles.middleGrid}>
          <HoloChart data={chartData} labels={chartLabels} />
          <PenaltyPipeline detectees={24500} contestees={10000} validees={7316} />
        </div>

        {/* --- ROW 3: DETAILED TABLE --- */}
        <div className={styles.tableWrapper}>
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
                  <td><span style={{color:'#38bdf8', fontWeight:'bold'}}>RACC</span></td>
                  <td style={{fontWeight:'bold'}}>{item.processus.replace(/_/g, ' ')}</td>
                  <td>{item.num.toLocaleString()}</td>
                  <td>{item.denum.toLocaleString()}</td>
                  <td><span className={styles.badgeSuccess}>{item.resultat}%</span></td>
                  <td><span className={styles.badgeBonus}>+{item.bonus}%</span></td>
                </tr>
              ))}
              {savData.map(item => (
                <tr key={item.id}>
                  <td><span style={{color:'#10b981', fontWeight:'bold'}}>SAV</span></td>
                  <td style={{fontWeight:'bold'}}>{item.processus.replace(/_/g, ' ')}</td>
                  <td>{item.num.toLocaleString()}</td>
                  <td>{item.denum.toLocaleString()}</td>
                  <td><span className={styles.badgeSuccess}>{item.resultat}%</span></td>
                  <td><span className={styles.badgeBonus}>+{item.bonus}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}