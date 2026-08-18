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

  // 🛡️ L'FIX HWA HNA: Enrichissement dyal TAUX_PLAINTE b l'DENUM dyal Fichier 2
  const displayData = data.map(row => {
    if (row.indicateur === 'TAUX_PLAINTE') {
      const f2Denum = data
        .filter(d => ['PLP', 'HOTLINE', 'CONSTRUCTION', 'RANG_2'].includes(d.indicateur))
        .reduce((sum, d) => sum + d.denum, 0);
      
      const res = f2Denum > 0 ? Number(((row.num / f2Denum) * 100).toFixed(2)) : 0;
      return { ...row, denum: f2Denum, resultat: res, isLocked: f2Denum === 0 } as any;
    }
    return row;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Mes Indicateurs CQ</h1>
        <p>Consultez vos performances (PLP, Hotline, Construction, SACLI, Taux de Plainte...) pour le mois sélectionné.</p>
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
              {displayData.map((row: any) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 'bold', color: '#3498db' }}>{row.indicateur.replace('_', ' ')}</td>
                  <td>{row.zone === 'GLOBAL' ? '-' : `ZONE ${row.zone}`}</td>
                  <td>{row.num.toLocaleString('fr-FR')}</td>
                  
                  {/* 🛡️ L'FIX HWA HNA: Affichage dyal l'9fel ila kan Fichier 2 mazal mat-injecta */}
                  <td>{row.isLocked ? <span title="Nécessite l'import du Fichier 2 (PLP...)">🔒</span> : row.denum.toLocaleString('fr-FR')}</td>
                  <td>
                    {row.isLocked 
                      ? <span className={styles.badgeSuccess} style={{background:'#f1f2f6', color:'#7f8c8d'}}>En attente F2</span> 
                      : <span className={styles.badgeSuccess}>{row.resultat}%</span>}
                  </td>
                </tr>
              ))}
              {displayData.length === 0 && (
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