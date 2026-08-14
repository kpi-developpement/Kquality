"use client";

import { useEffect, useState } from 'react';
import { getAdminCqData, getActivePartenairesForCq } from '@/services/apiService';
import { CqDataDTO, PartenaireDTO } from '@/types/api';
import styles from './AdminCqData.module.css';

const TABS = ["Audits tech", "Check-voisinage", "Expertises SAV", "Taux de coupures"];

export default function AdminCqDataPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [data, setData] = useState<CqDataDTO[]>([]);
  const [allData, setAllData] = useState<CqDataDTO[]>([]); 
  const [partenaires, setPartenaires] = useState<PartenaireDTO[]>([]);
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedPartenaire, setSelectedPartenaire] = useState("ALL");
  
  const [visionMode, setVisionMode] = useState<'ADMIN' | 'PARTENAIRE'>('ADMIN');
  const [loading, setLoading] = useState(false);

  // 🛡️ L'FIX HWA HNA: Mli ytbeddel l'Mois wla l'Année, kan-jbdou ghir les partenaires li 3ndhom data
  useEffect(() => {
    getActivePartenairesForCq(month, year)
      .then(activeList => {
        setPartenaires(activeList);
        // Ila l'partenaire li khtarina f l'dropdown mab9ach f liste jdida, kan-redouh l "ALL"
        if (selectedPartenaire !== "ALL" && !activeList.find(p => p.id.toString() === selectedPartenaire)) {
          setSelectedPartenaire("ALL");
        }
      })
      .catch(console.error);
  }, [month, year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAdminCqData(activeTab, month, year, selectedPartenaire === "ALL" ? undefined : selectedPartenaire);
      setData(res);

      const allPromises = TABS.map(tab => getAdminCqData(tab, month, year, selectedPartenaire === "ALL" ? undefined : selectedPartenaire));
      const allResults = await Promise.all(allPromises);
      setAllData(allResults.flat());

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, month, year, selectedPartenaire]);

  const calculateTotal = (sheetName?: string) => {
    const targetData = sheetName ? allData.filter(d => d.typeFeuille === sheetName) : allData;
    return targetData.reduce((sum, row) => sum + (visionMode === 'ADMIN' ? (row.montant || 0) : (row.mtSst || 0)), 0);
  };

  const totalGlobal = calculateTotal();
  
  const progressColors = {
    "Check-voisinage": "#e74c3c",
    "Audits tech": "#f39c12",
    "Expertises SAV": "#3498db",
    "Taux de coupures": "#1abc9c"
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.adminBadge}>ESPACE ADMIN</div>
        <h1>Données CQ (Multi-Feuilles)</h1>
        <p>Consultez et filtrez les données importées depuis les fichiers Excel.</p>
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
            <option value="ALL">Tous les partenaires ({partenaires.length})</option>
            {partenaires.map(p => <option key={p.id} value={p.id.toString()}>{p.nomEntreprise}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        <div className={styles.estimationCard}>
          <div className={styles.estHeader}>
            <h3 className={styles.estTitle}>Projection des pénalités</h3>
            <span className={styles.estBadge}>ESTIMATION</span>
          </div>
          <h2 className={styles.estAmount}>{totalGlobal.toLocaleString('fr-FR')} €</h2>
          <p className={styles.estSub}>si la période clôturait aujourd'hui</p>

          <div className={styles.progressList}>
            {TABS.map(tab => {
              const tabTotal = calculateTotal(tab);
              const percentage = totalGlobal > 0 ? (tabTotal / totalGlobal) * 100 : 0;
              
              return (
                <div key={tab} className={styles.progressItem}>
                  <div className={styles.progressHeader}>
                    <span>{tab}</span>
                    <span>{tabTotal.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div 
                      className={styles.progressBarFill} 
                      style={{ width: `${percentage}%`, backgroundColor: progressColors[tab as keyof typeof progressColors] }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className={styles.toggleContainer}>
            <button 
              className={`${styles.toggleBtn} ${visionMode === 'ADMIN' ? styles.active : ''}`}
              onClick={() => setVisionMode('ADMIN')}
            >
              Vision Admin (Montant Global)
            </button>
            <button 
              className={`${styles.toggleBtn} ${visionMode === 'PARTENAIRE' ? styles.active : ''}`}
              onClick={() => setVisionMode('PARTENAIRE')}
            >
              Vision Partenaire (MT SST)
            </button>
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
                    {activeTab === "Audits tech" && <><th>ID RDV</th><th>DPT</th><th>{visionMode === 'ADMIN' ? 'Montant' : 'MT SST'}</th><th>KYN</th></>}
                    {activeTab === "Check-voisinage" && <><th>Intervention</th><th>Voisins KO</th><th>{visionMode === 'ADMIN' ? 'Montant' : 'MT SST'}</th><th>KYN</th></>}
                    {activeTab === "Expertises SAV" && <><th>N° Intervention</th><th>{visionMode === 'ADMIN' ? 'Montant' : 'MT SST'}</th><th>KYN</th></>}
                    {activeTab === "Taux de coupures" && <><th>ID RDV</th><th>Clients Coupés</th><th>DPT</th><th>{visionMode === 'ADMIN' ? 'Montant' : 'MT SST'}</th><th>KYN</th></>}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => {
                    const montantToDisplay = visionMode === 'ADMIN' ? row.montant : row.mtSst;
                    return (
                      <tr key={row.id}>
                        <td style={{ fontWeight: 'bold', color: '#2c3e50' }}>{row.partenaireNom}</td>
                        {activeTab === "Audits tech" && <><td>{row.reference}</td><td>{row.departement}</td><td style={{fontWeight:'bold', color:'#e74c3c'}}>{montantToDisplay || 0} €</td><td>{row.kyn}</td></>}
                        {activeTab === "Check-voisinage" && <><td>{row.reference}</td><td>{row.valeurMetrique}</td><td style={{fontWeight:'bold', color:'#e74c3c'}}>{montantToDisplay || 0} €</td><td>{row.kyn}</td></>}
                        {activeTab === "Expertises SAV" && <><td>{row.reference}</td><td style={{fontWeight:'bold', color:'#e74c3c'}}>{montantToDisplay || 0} €</td><td>{row.kyn}</td></>}
                        {activeTab === "Taux de coupures" && <><td>{row.reference}</td><td>{row.valeurMetrique}</td><td>{row.departement}</td><td style={{fontWeight:'bold', color:'#e74c3c'}}>{montantToDisplay || 0} €</td><td>{row.kyn}</td></>}
                      </tr>
                    );
                  })}
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
      </div>
    </div>
  );
}