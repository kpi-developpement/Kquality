"use client";

import { useEffect, useState } from 'react';
import { getAdminCqData, getActivePartenairesForCq } from '@/services/apiService';
import { CqDataDTO, PartenaireDTO } from '@/types/api';
import CustomSelect from '../vue-globale/components/CustomSelect/CustomSelect'; 
import InteractiveCard from '../vue-globale/components/InteractiveCard/InteractiveCard'; 
import styles from './AdminCqData.module.css';

const TABS_CONFIG = [
  { id: "Audits tech", title: "Audits Tech", color: "#3b82f6", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg> },
  { id: "Check-voisinage", title: "Voisinage", color: "#f59e0b", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
  { id: "Expertises SAV", title: "Expertises SAV", color: "#8b5cf6", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg> },
  { id: "Taux de coupures", title: "Coupures", color: "#10b981", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> }
];

export default function AdminCqDataPage() {
  const [activeTab, setActiveTab] = useState(TABS_CONFIG[0].id);
  const [data, setData] = useState<CqDataDTO[]>([]);
  const [allData, setAllData] = useState<CqDataDTO[]>([]); 
  const [partenaires, setPartenaires] = useState<PartenaireDTO[]>([]);
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedPartenaire, setSelectedPartenaire] = useState("ALL");
  
  const [visionMode, setVisionMode] = useState<'ADMIN' | 'PARTENAIRE'>('ADMIN');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getActivePartenairesForCq(month, year)
      .then(activeList => {
        setPartenaires(activeList);
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

      const allPromises = TABS_CONFIG.map(tab => getAdminCqData(tab.id, month, year, selectedPartenaire === "ALL" ? undefined : selectedPartenaire));
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

  const monthOptions = [1,2,3,4,5,6,7,8,9,10,11,12].map(m => ({ value: m, label: `Mois ${m}` }));
  const yearOptions = [2024, 2025, 2026, 2027].map(y => ({ value: y, label: y.toString() }));
  const partenaireOptions = [
    { value: "ALL", label: `Tous les partenaires (${partenaires.length})` },
    ...partenaires.map(p => ({ value: p.id.toString(), label: p.nomEntreprise }))
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <div className={styles.adminBadge}>DISPATCHER CENTER</div>
            <h1>Données CQ</h1>
            <p>Analyse granulaire des fichiers Excel importés.</p>
          </div>
        </header>

        {/* 🚀 L'FIX Z-INDEX HNA: L'filtersWrapper rah z-index: 1000 f CSS */}
        <div className={styles.filtersWrapper}>
          <div className={styles.filterGroup}>
            <label>Période Cible</label>
            <CustomSelect value={month} options={monthOptions} onChange={setMonth} width="140px" />
          </div>
          <div className={styles.filterGroup}>
            <label>Année</label>
            <CustomSelect value={year} options={yearOptions} onChange={setYear} width="110px" />
          </div>
          <div className={styles.filterGroup} style={{ flex: 1 }}>
            <label>Filtrer par Partenaire</label>
            <CustomSelect value={selectedPartenaire} options={partenaireOptions} onChange={setSelectedPartenaire} width="100%" />
          </div>
        </div>

        <div className={styles.dashboardGrid}>
          <div>
            {/* 🚀 L'CARTE F L'HOVER GHA YTBEDEL L'CADER DYALHA (ANIMATED BORDER) */}
            <InteractiveCard delayIndex={1}>
              <div className={styles.estimationContent}>
                <div className={styles.estHeader}>
                  <h3 className={styles.estTitle}>Projection Globale</h3>
                  <span className={styles.estBadge}>ESTIMATION</span>
                </div>
                <h2 className={styles.estAmount}>{totalGlobal.toLocaleString('fr-FR')} €</h2>
                <p className={styles.estSub}>si la période clôturait aujourd'hui</p>

                <div className={styles.progressList}>
                  {TABS_CONFIG.map(tab => {
                    const tabTotal = calculateTotal(tab.id);
                    const percentage = totalGlobal > 0 ? (tabTotal / totalGlobal) * 100 : 0;
                    
                    return (
                      <div key={tab.id} className={styles.progressItem}>
                        <div className={styles.progressHeader}>
                          <span>{tab.title}</span>
                          <span style={{ color: tab.color }}>{tabTotal.toLocaleString('fr-FR')} €</span>
                        </div>
                        <div className={styles.progressBarBg}>
                          <div 
                            className={styles.progressBarFill} 
                            style={{ 
                              width: `${percentage}%`, 
                              backgroundColor: tab.color,
                              boxShadow: `0 0 12px ${tab.color}90` 
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </InteractiveCard>
          </div>

          <div>
            <div className={styles.visionToggle}>
              <button 
                className={`${styles.visionBtn} ${visionMode === 'ADMIN' ? styles.active : ''}`}
                onClick={() => setVisionMode('ADMIN')}
              >
                Vision Admin (Montant)
              </button>
              <button 
                className={`${styles.visionBtn} ${visionMode === 'PARTENAIRE' ? styles.active : ''}`}
                onClick={() => setVisionMode('PARTENAIRE')}
              >
                Vision Partenaire (MT SST)
              </button>
            </div>

            <div className={styles.tabs}>
              {TABS_CONFIG.map(tab => (
                <button 
                  key={tab.id} 
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''}`} 
                  onClick={() => setActiveTab(tab.id)}
                  style={activeTab === tab.id ? { border: `2px solid ${tab.color}`, color: tab.color } : {}}
                >
                  <span style={{ width: '18px', height: '18px', display: 'flex' }}>{tab.icon}</span>
                  {tab.title}
                </button>
              ))}
            </div>

            <div className={styles.tableWrapper}>
              {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Récupération des anomalies...</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Partenaire</th>
                      {activeTab === "Audits tech" && <><th>ID RDV</th><th>DPT</th><th>Impact ({visionMode})</th><th>KYN</th></>}
                      {activeTab === "Check-voisinage" && <><th>Intervention</th><th>Voisins KO</th><th>Impact ({visionMode})</th><th>KYN</th></>}
                      {activeTab === "Expertises SAV" && <><th>N° Intervention</th><th>Impact ({visionMode})</th><th>KYN</th></>}
                      {activeTab === "Taux de coupures" && <><th>ID RDV</th><th>Clients Coupés</th><th>DPT</th><th>Impact ({visionMode})</th><th>KYN</th></>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, index) => {
                      const montantToDisplay = visionMode === 'ADMIN' ? row.montant : row.mtSst;
                      return (
                        <tr key={row.id} className={styles.tableRow} style={{ animationDelay: `${index * 0.05}s` }}>
                          <td className={styles.partenaireName}>
                            <span style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#3b82f6', display:'inline-block', boxShadow: '0 0 8px rgba(59,130,246,0.5)' }}></span>
                            {row.partenaireNom}
                          </td>
                          {activeTab === "Audits tech" && <><td style={{fontWeight:'900', color:'#334155'}}>{row.reference}</td><td>DPT {row.departement}</td><td><span className={styles.badgeSst}>{montantToDisplay || 0} €</span></td><td><span className={styles.kynBadge}>{row.kyn}</span></td></>}
                          {activeTab === "Check-voisinage" && <><td style={{fontWeight:'900', color:'#334155'}}>{row.reference}</td><td>{row.valeurMetrique}</td><td><span className={styles.badgeSst}>{montantToDisplay || 0} €</span></td><td><span className={styles.kynBadge}>{row.kyn}</span></td></>}
                          {activeTab === "Expertises SAV" && <><td style={{fontWeight:'900', color:'#334155'}}>{row.reference}</td><td><span className={styles.badgeSst}>{montantToDisplay || 0} €</span></td><td><span className={styles.kynBadge}>{row.kyn}</span></td></>}
                          {activeTab === "Taux de coupures" && <><td style={{fontWeight:'900', color:'#334155'}}>{row.reference}</td><td>{row.valeurMetrique}</td><td>DPT {row.departement}</td><td><span className={styles.badgeSst}>{montantToDisplay || 0} €</span></td><td><span className={styles.kynBadge}>{row.kyn}</span></td></>}
                        </tr>
                      );
                    })}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan={6} className={styles.empty}>Aucune anomalie trouvée dans cette catégorie.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}