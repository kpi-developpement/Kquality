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
    getAdminCqPartenaire(month, year, selectedPartenaire)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month, year, selectedPartenaire]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.adminBadge}>ESPACE ADMIN</div>
        <h1>Calculs CQ Partenaire</h1>
        <p>Performances PLP, Hotline, Construction et Rang 2 par partenaire.</p>
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
            <option value="ALL">Tous les partenaires</option>
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
              {data.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 'bold', color: '#2c3e50' }}>{row.partenaireNom}</td>
                  <td style={{ fontWeight: 'bold', color: '#3498db' }}>{row.indicateur.replace('_', ' ')}</td>
                  <td>ZONE {row.zone}</td>
                  <td>{row.num}</td>
                  <td>{row.denum}</td>
                  <td><span className={styles.badgeSuccess}>{row.resultat}%</span></td>
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
  );
}