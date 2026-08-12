"use client";

import { useState, useEffect } from 'react';
import { getKpiGlobalAdmin } from '@/services/apiService';
import { KpiArchiveDTO } from '@/types/api';
import Link from 'next/link';
import styles from './VueGlobale.module.css';

export default function VueGlobalePage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDept, setSelectedDept] = useState("GLOBAL");
  
  const [data, setData] = useState<KpiArchiveDTO[]>([]);
  const [departments, setDepartments] = useState<string[]>(["GLOBAL"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getKpiGlobalAdmin(month, year);
      setData(result);

      // Extraire les départements uniques
      const depts = new Set<string>();
      result.forEach(item => depts.add(item.departement));
      
      const sortedDepts = Array.from(depts).sort((a, b) => {
        if (a === "GLOBAL") return -1;
        if (b === "GLOBAL") return 1;
        return a.localeCompare(b);
      });

      setDepartments(sortedDepts.length > 0 ? sortedDepts : ["GLOBAL"]);
      if (!sortedDepts.includes(selectedDept)) {
        setSelectedDept("GLOBAL");
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Charger la data par défaut au montage
  useEffect(() => {
    fetchData();
  }, []);

  // Filtrer la data selon le département sélectionné
  const filteredData = data.filter(item => item.departement === selectedDept);

  // Séparer RACC et SAV
  const raccProcessus = ["SACLI_OK", "SARCLI_NOK", "GEM_NOK", "TAUX_20J", "ZMD_AMII", "ZMD_RIP", "ZTD", "TNH", "PERF_RANG_1_A", "PERF_RANG_1_B", "PERF_RANG_1_C", "HOTLINE_RANG_1_A", "HOTLINE_RANG_1_B", "HOTLINE_RANG_1_C", "CONSTRUCTION_RANG_1_A", "CONSTRUCTION_RANG_1_B", "CONSTRUCTION_RANG_1_C", "PERF_RANG_2_A", "PERF_RANG_2_B", "PERF_RANG_2_C"];
  
  const raccData = filteredData.filter(item => raccProcessus.includes(item.processus));
  const savData = filteredData.filter(item => !raccProcessus.includes(item.processus));

  const totalRaccBonus = raccData.reduce((sum, item) => sum + item.bonus, 0);
  const finalScore = 90 + totalRaccBonus;

  return (
    <div className={styles.container}>
      <Link href="/admin" style={{ color: '#3498db', fontWeight: 'bold', textDecoration: 'none', marginBottom: '15px', display: 'inline-block' }}>
        &larr; Retour à l'Admin
      </Link>

      <header className={styles.header}>
        <div>
          <div className={styles.adminBadge}>TOUR DE CONTRÔLE</div>
          <h1>Vue Globale des KPIs</h1>
          <p>Données synchronisées depuis l'usine de calcul (ContratQuality).</p>
        </div>
      </header>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Mois</label>
          <select className={styles.filterSelect} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Année</label>
          <select className={styles.filterSelect} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Département</label>
          <select className={styles.filterSelect} value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
            {departments.map(d => (
              <option key={d} value={d}>{d === "GLOBAL" ? "Vue Globale (Tous)" : `DPT ${d}`}</option>
            ))}
          </select>
        </div>
        <button className={styles.btnSearch} onClick={fetchData} disabled={loading}>
          {loading ? 'Chargement...' : 'Rechercher'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      <h2 className={styles.sectionTitle}>Flux Qualité RACC</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
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
                <td className={styles.processName}>{item.processus.replace(/_/g, ' ')}</td>
                <td>{item.num.toLocaleString()}</td>
                <td>{item.denum.toLocaleString()}</td>
                <td><span className={styles.badgeSuccess}>{item.resultat}%</span></td>
                <td><span className={styles.badgeBonus}>+{item.bonus}%</span></td>
              </tr>
            ))}
            {raccData.length === 0 && <tr><td colSpan={5} className={styles.empty}>Aucune donnée RACC trouvée pour cette période.</td></tr>}
            
            {raccData.length > 0 && (
              <tr className={styles.totalRow}>
                <td colSpan={4} style={{ textAlign: 'right' }}>
                  SCORE DE BASE (90%) + TOTAL BONUS RACC (+{totalRaccBonus.toFixed(2)}%) =
                </td>
                <td>
                  <span className={styles.finalScore}>{finalScore.toFixed(2)}%</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className={styles.sectionTitle}>Flux Qualité SAV</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Indicateur Métrique</th>
              <th>NUM</th>
              <th>DENUM</th>
              <th>Performance Brut</th>
              <th>Bonus Consolidé</th>
            </tr>
          </thead>
          <tbody>
            {savData.map(item => (
              <tr key={item.id}>
                <td className={styles.processName}>{item.processus.replace(/_/g, ' ')}</td>
                <td>{item.num.toLocaleString()}</td>
                <td>{item.denum.toLocaleString()}</td>
                <td><span className={styles.badgeSuccess}>{item.resultat}%</span></td>
                <td><span className={styles.badgeBonus}>+{item.bonus}%</span></td>
              </tr>
            ))}
            {savData.length === 0 && <tr><td colSpan={5} className={styles.empty}>Aucune donnée SAV trouvée pour cette période.</td></tr>}
          </tbody>
        </table>
      </div>

    </div>
  );
}