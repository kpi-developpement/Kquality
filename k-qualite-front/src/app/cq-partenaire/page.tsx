"use client";

import { useEffect, useState } from 'react';
import { getPartenaireCqKpis } from '@/services/apiService';
import { CqPartenaireKpiDTO } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import styles from './CqPartenaire.module.css';

export default function CqPartenairePage() {
  const { user } = useAuth();
  const [data, setData] = useState<CqPartenaireKpiDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user?.partenaireId) {
      setLoading(true);
      getPartenaireCqKpis(user.partenaireId, month, year)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, month, year]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Mes Indicateurs CQ</h1>
        <p>Consultez vos performances (PLP, Hotline, Construction, SACLI...) pour le mois sélectionné.</p>
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
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>Chargement de vos indicateurs...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
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
                  <td style={{ fontWeight: 'bold', color: '#3498db' }}>{row.indicateur.replace('_', ' ')}</td>
                  <td>{row.zone === 'GLOBAL' ? '-' : `ZONE ${row.zone}`}</td>
                  <td>{row.num.toLocaleString('fr-FR')}</td>
                  <td>{row.denum.toLocaleString('fr-FR')}</td>
                  <td><span className={styles.badgeSuccess}>{row.resultat}%</span></td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.empty}>Aucune donnée trouvée pour cette période.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}