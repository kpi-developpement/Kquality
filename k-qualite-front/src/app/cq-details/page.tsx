"use client";

import { useEffect, useState } from 'react';
import { getCqDataByPartenaire } from '@/services/apiService';
import { CqDataDTO } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import styles from './CqDetails.module.css';

const TABS = ["Audits tech", "Check-voisinage", "Expertises SAV", "Taux de coupures"];

export default function CqDetailsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [data, setData] = useState<CqDataDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user?.partenaireId) {
      setLoading(true);
      getCqDataByPartenaire(user.partenaireId, activeTab, month, year)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, activeTab, month, year]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Détails CQ (Fichiers Excel)</h1>
        <p>Consultez les lignes qui vous ont été attribuées depuis les fichiers d'analyse.</p>
      </header>

      <div style={{ display: 'flex', gap: '15px', background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d' }}>MOIS</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d' }}>ANNÉE</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button key={tab} className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>Chargement des données...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                {/* 🛡️ L'FIX HWA HNA: L'Partenaire kay-chouf ghir MT SST */}
                {activeTab === "Audits tech" && <><th>Mois</th><th>ID RDV</th><th>Département</th><th>MT SST</th><th>KYN</th></>}
                {activeTab === "Check-voisinage" && <><th>Mois</th><th>Intervention</th><th>Voisins KO</th><th>MT SST</th><th>KYN</th></>}
                {activeTab === "Expertises SAV" && <><th>N° Intervention</th><th>MT SST</th><th>KYN</th></>}
                {activeTab === "Taux de coupures" && <><th>ID RDV</th><th>Clients Coupés</th><th>Département</th><th>MT SST</th><th>KYN</th></>}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  {activeTab === "Audits tech" && <><td>{row.anMois}</td><td>{row.reference}</td><td>{row.departement}</td><td style={{fontWeight:'bold', color:'#e74c3c'}}>{row.mtSst || 0} €</td><td>{row.kyn}</td></>}
                  {activeTab === "Check-voisinage" && <><td>{row.anMois}</td><td>{row.reference}</td><td>{row.valeurMetrique}</td><td style={{fontWeight:'bold', color:'#e74c3c'}}>{row.mtSst || 0} €</td><td>{row.kyn}</td></>}
                  {activeTab === "Expertises SAV" && <><td>{row.reference}</td><td style={{fontWeight:'bold', color:'#e74c3c'}}>{row.mtSst || 0} €</td><td>{row.kyn}</td></>}
                  {activeTab === "Taux de coupures" && <><td>{row.reference}</td><td>{row.valeurMetrique}</td><td>{row.departement}</td><td style={{fontWeight:'bold', color:'#e74c3c'}}>{row.mtSst || 0} €</td><td>{row.kyn}</td></>}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.empty}>Aucune donnée trouvée pour "{activeTab}".</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}