"use client";

import { useEffect, useState } from 'react';
import { getAdminCqData, getAdminPartenaires } from '@/services/apiService';
import { CqDataDTO, PartenaireDTO } from '@/types/api';
import styles from '../../cq-details/CqDetails.module.css'; // Kan-khedmou b nfs CSS dyal l'partenaire

const TABS = ["Audits tech", "Check-voisinage", "Expertises SAV", "Taux de coupures"];

export default function AdminCqDataPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [data, setData] = useState<CqDataDTO[]>([]);
  const [partenaires, setPartenaires] = useState<PartenaireDTO[]>([]);
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedPartenaire, setSelectedPartenaire] = useState("ALL");
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAdminPartenaires().then(setPartenaires).catch(console.error);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAdminCqData(activeTab, month, year, selectedPartenaire);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch auto mli kay-tbeddel l'onglet awla l'filtre
  useEffect(() => {
    fetchData();
  }, [activeTab, month, year, selectedPartenaire]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'inline-block', backgroundColor: '#2c3e50', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>ESPACE ADMIN</div>
        <h1>Données CQ (Multi-Feuilles)</h1>
        <p>Consultez et filtrez les données importées depuis les fichiers Excel.</p>
      </header>

      <div style={{ display: 'flex', gap: '15px', background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '20px', alignItems: 'flex-end' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d' }}>PARTENAIRE</label>
          <select value={selectedPartenaire} onChange={e => setSelectedPartenaire(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="ALL">Tous les partenaires</option>
            {partenaires.map(p => <option key={p.id} value={p.id}>{p.nomEntreprise}</option>)}
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
                <th>Partenaire</th>
                {activeTab === "Audits tech" && <><th>Mois</th><th>ID RDV</th><th>Département</th><th>Montant</th><th>KYN</th></>}
                {activeTab === "Check-voisinage" && <><th>Mois</th><th>Intervention</th><th>Voisins KO</th><th>Montant</th><th>KYN</th></>}
                {activeTab === "Expertises SAV" && <><th>N° Intervention</th><th>KYN</th></>}
                {activeTab === "Taux de coupures" && <><th>ID RDV</th><th>Clients Coupés</th><th>Département</th><th>Montant</th><th>KYN</th></>}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 'bold', color: '#2c3e50' }}>{row.partenaireNom}</td>
                  {activeTab === "Audits tech" && <><td>{row.anMois}</td><td>{row.reference}</td><td>{row.departement}</td><td>{row.montant} €</td><td>{row.kyn}</td></>}
                  {activeTab === "Check-voisinage" && <><td>{row.anMois}</td><td>{row.reference}</td><td>{row.valeurMetrique}</td><td>{row.montant} €</td><td>{row.kyn}</td></>}
                  {activeTab === "Expertises SAV" && <><td>{row.reference}</td><td>{row.kyn}</td></>}
                  {activeTab === "Taux de coupures" && <><td>{row.reference}</td><td>{row.valeurMetrique}</td><td>{row.departement}</td><td>{row.montant} €</td><td>{row.kyn}</td></>}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.empty}>Aucune donnée trouvée pour "{activeTab}".</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}