"use client";

import { useEffect, useState } from 'react';
import { getAdminCqPartenaire, getAdminPartenaires } from '@/services/apiService';
import { CqPartenaireKpiDTO, PartenaireDTO } from '@/types/api';
import styles from '../cq-data/AdminCqData.module.css';

export default function AdminCqPartenairePage() {
  const [data, setData] = useState<CqPartenaireKpiDTO[]>([]);
  const [partenaires, setPartenaires] = useState<PartenaireDTO[]>([]);
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedPartenaire, setSelectedPartenaire] = useState("ALL");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAdminPartenaires().then(setPartenaires).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    // 🛡️ L'FIX HWA HNA: Mli ykoun ALL, kan-siftou undefined l'API bach t-jbed kolchi
    getAdminCqPartenaire(month, year, selectedPartenaire === "ALL" ? undefined : selectedPartenaire)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month, year, selectedPartenaire]);

  // 🛡️ L'FIX HWA HNA: L'Agrégation Globale f l'Frontend
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

    displayData = Object.values(aggregated).map(row => ({
      ...row,
      resultat: row.denum > 0 ? Number(((row.num / row.denum) * 100).toFixed(2)) : 0
    }));
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.adminBadge}>ESPACE ADMIN</div>
        <h1>Calculs CQ Partenaire</h1>
        <p>Performances PLP, Hotline, Construction, Rang 2, SACLI et SARCLI.</p>
      </header>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>MOIS</label>
          <select className={styles.filterSelect} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>ANNÉE</label>
          <select className={styles.filterSelect} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup} style={{ flex: 1 }}>
          <label>PARTENAIRE</label>
          <select className={styles.filterSelect} value={selectedPartenaire} onChange={e => setSelectedPartenaire(e.target.value)}>
            <option value="ALL">Vue Globale (Tous les partenaires)</option>
            {partenaires.map(p => <option key={p.id} value={p.id.toString()}>{p.nomEntreprise}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>Calculs en cours...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Partenaire</th>
                <th>Indicateur</th>
                <th>Zone</th>
                <th>NUM</th>
                <th>DENUM</th>
                <th>Taux de réussite</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((row) => (
                <tr key={row.id} style={{ backgroundColor: row.partenaireNom.includes("GLOBALE") ? '#f8f9fa' : 'white' }}>
                  <td style={{ fontWeight: 'bold', color: row.partenaireNom.includes("GLOBALE") ? '#e74c3c' : '#2c3e50' }}>{row.partenaireNom}</td>
                  <td style={{ fontWeight: 'bold', color: '#3498db' }}>{row.indicateur.replace('_', ' ')}</td>
                  <td>{row.zone === 'GLOBAL' ? '-' : `ZONE ${row.zone}`}</td>
                  <td>{row.num.toLocaleString('fr-FR')}</td>
                  <td>{row.denum.toLocaleString('fr-FR')}</td>
                  <td><span className={styles.badgeSuccess}>{row.resultat}%</span></td>
                </tr>
              ))}
              {displayData.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.empty}>Aucune donnée trouvée pour cette période.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}