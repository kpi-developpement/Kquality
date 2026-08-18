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
    getAdminCqPartenaire(month, year, selectedPartenaire === "ALL" ? undefined : selectedPartenaire)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month, year, selectedPartenaire]);

  // 🛡️ L'FIX HWA HNA: L'Agrégation Globale w l'Calcul Dynamique dyal TAUX_PLAINTE
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

    displayData = Object.values(aggregated);
  }

  // 🛡️ ENRICHISSEMENT TAUX_PLAINTE
  displayData = displayData.map(row => {
    if (row.indicateur === 'TAUX_PLAINTE') {
      // N-jme3ou l'DENUM dyal Fichier 2 l nfs l'Partenaire (awla l'Global)
      const f2Denum = displayData
        .filter(d => d.partenaireNom === row.partenaireNom && ['PLP', 'HOTLINE', 'CONSTRUCTION', 'RANG_2'].includes(d.indicateur))
        .reduce((sum, d) => sum + d.denum, 0);
      
      const res = f2Denum > 0 ? Number(((row.num / f2Denum) * 100).toFixed(2)) : 0;
      return { ...row, denum: f2Denum, resultat: res, isLocked: f2Denum === 0 } as any;
    }
    return row;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.adminBadge}>ESPACE ADMIN</div>
        <h1>Calculs CQ Partenaire</h1>
        <p>Performances PLP, Hotline, Construction, Rang 2, SACLI, SARCLI, et Taux de Plainte.</p>
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
              {displayData.map((row: any) => (
                <tr key={row.id} style={{ backgroundColor: row.partenaireNom.includes("GLOBALE") ? '#f8f9fa' : 'white' }}>
                  <td style={{ fontWeight: 'bold', color: row.partenaireNom.includes("GLOBALE") ? '#e74c3c' : '#2c3e50' }}>{row.partenaireNom}</td>
                  <td style={{ fontWeight: 'bold', color: '#3498db' }}>{row.indicateur.replace('_', ' ')}</td>
                  <td>{row.zone === 'GLOBAL' ? '-' : `ZONE ${row.zone}`}</td>
                  <td>{row.num.toLocaleString('fr-FR')}</td>
                  {/* 🛡️ L'FIX HWA HNA: Affichage dyal l'9fel ila kan Fichier 2 mazal mat-injecta */}
                  <td>{row.isLocked ? <span title="Nécessite l'import du Fichier 2 (PLP...)">🔒</span> : row.denum.toLocaleString('fr-FR')}</td>
                  <td>
                    {row.isLocked 
                      ? <span className={styles.badgeBonus} style={{background:'#f1f2f6', color:'#7f8c8d'}}>En attente F2</span> 
                      : <span className={styles.badgeSuccess}>{row.resultat}%</span>}
                  </td>
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