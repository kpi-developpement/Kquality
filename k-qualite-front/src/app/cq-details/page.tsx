"use client";

import { useEffect, useState } from 'react';
import { getCqDataByPartenaire, contesterCqData } from '@/services/apiService';
import { CqDataDTO } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import styles from './CqDetails.module.css';

const TABS_CONFIG = [
  { id: "Audits tech", title: "Audits Techniques", classColor: "active_audits", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg> },
  { id: "Check-voisinage", title: "Check Voisinage", classColor: "active_voisinage", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
  { id: "Expertises SAV", title: "Expertises SAV", classColor: "active_expertises", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg> },
  { id: "Taux de coupures", title: "Taux de Coupures", classColor: "active_coupures", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> }
];

export default function CqDetailsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS_CONFIG[0].id);
  const [data, setData] = useState<CqDataDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // 🚀 MODALS STATE
  const [isContestModalOpen, setIsContestModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<CqDataDTO | null>(null);
  const [motif, setMotif] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = () => {
    if (user?.partenaireId) {
      setLoading(true);
      getCqDataByPartenaire(user.partenaireId, activeTab, month, year)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { fetchData(); }, [user, activeTab, month, year]);

  const totalMtSst = data.reduce((sum, row) => sum + (row.mtSst || 0), 0);

  const openContestModal = (row: CqDataDTO) => {
    setSelectedRow(row);
    setMotif("");
    setIsContestModalOpen(true);
  };

  const openDetailsModal = (row: CqDataDTO) => {
    setSelectedRow(row);
    setIsDetailsModalOpen(true);
  };

  const handleContestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRow) return;
    setActionLoading(true);
    try {
      await contesterCqData(selectedRow.id, motif);
      alert("Contestation envoyée avec succès !");
      setIsContestModalOpen(false);
      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleBox}>
            <h1>Détails CQ & Pénalités</h1>
            <p>Consultez l'historique détaillé des lignes impactant votre MT SST.</p>
          </div>

          <div className={styles.controls}>
            <div className={styles.filterGroup}>
              <label>Mois d'analyse</label>
              <div className={styles.selectWrapper}>
                <select value={month} onChange={e => setMonth(Number(e.target.value))} className={styles.select}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Mois {m}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.filterGroup}>
              <label>Année fiscale</label>
              <div className={styles.selectWrapper}>
                <select value={year} onChange={e => setYear(Number(e.target.value))} className={styles.select}>
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.tabGrid}>
          {TABS_CONFIG.map((tab, index) => (
            <div 
              key={tab.id} 
              className={`${styles.tabCard} ${activeTab === tab.id ? `${styles.active} ${styles[tab.classColor]}` : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={styles.iconBox}>
                {tab.icon}
              </div>
              <div className={styles.tabInfo}>
                <h4 className={styles.tabTitle}>{tab.title}</h4>
                <span className={styles.tabSub}>{activeTab === tab.id ? 'Filtre Actif' : 'Cliquer pour filtrer'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.dashboardSection}>
          <div className={styles.sectionHeader}>
            <h3>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Lignes Détectées - {activeTab}
            </h3>
            {totalMtSst > 0 && (
              <div className={styles.totalBadge}>
                Total Pénalités : {totalMtSst.toLocaleString('fr-FR')} €
              </div>
            )}
          </div>

          <div className={styles.tableWrapper}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Chargement sécurisé des données...</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    {activeTab === "Audits tech" && <><th>Mois</th><th>ID RDV</th><th>Département</th><th>Impact (MT SST)</th><th>KYN</th></>}
                    {activeTab === "Check-voisinage" && <><th>Mois</th><th>N° Intervention</th><th>Voisins KO</th><th>Impact (MT SST)</th><th>KYN</th></>}
                    {activeTab === "Expertises SAV" && <><th>N° Intervention</th><th>Impact (MT SST)</th><th>KYN</th></>}
                    {activeTab === "Taux de coupures" && <><th>ID RDV</th><th>Clients Coupés</th><th>Département</th><th>Impact (MT SST)</th><th>KYN</th></>}
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr key={row.id} className={styles.tableRow} style={{ animationDelay: `${index * 0.05}s` }}>
                      {activeTab === "Audits tech" && <><td>{row.anMois}</td><td style={{fontWeight: '900', color: '#3b82f6'}}>{row.reference}</td><td>DPT {row.departement}</td><td><span className={styles.badgeSst}>{row.mtSst || 0} €</span></td><td><span className={styles.kynBadge}>{row.kyn}</span></td></>}
                      {activeTab === "Check-voisinage" && <><td>{row.anMois}</td><td style={{fontWeight: '900', color: '#3b82f6'}}>{row.reference}</td><td>{row.valeurMetrique}</td><td><span className={styles.badgeSst}>{row.mtSst || 0} €</span></td><td><span className={styles.kynBadge}>{row.kyn}</span></td></>}
                      {activeTab === "Expertises SAV" && <><td style={{fontWeight: '900', color: '#3b82f6'}}>{row.reference}</td><td><span className={styles.badgeSst}>{row.mtSst || 0} €</span></td><td><span className={styles.kynBadge}>{row.kyn}</span></td></>}
                      {activeTab === "Taux de coupures" && <><td style={{fontWeight: '900', color: '#3b82f6'}}>{row.reference}</td><td>{row.valeurMetrique}</td><td>DPT {row.departement}</td><td><span className={styles.badgeSst}>{row.mtSst || 0} €</span></td><td><span className={styles.kynBadge}>{row.kyn}</span></td></>}
                      
                      {/* 🚀 NOUVELLES COLONNES : STATUT ET ACTIONS */}
                      <td>
                        <span className={`${styles.badge} ${styles[row.statutContestation?.toLowerCase() || 'non_conteste']}`}>
                          {(row.statutContestation || 'NON CONTESTE').replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionsBox}>
                          {(!row.statutContestation || row.statutContestation === 'NON_CONTESTE') && (
                            <button className={styles.actionBtn} onClick={() => openContestModal(row)}>Action</button>
                          )}
                          <button className={styles.detailsBtn} onClick={() => openDetailsModal(row)}>Détails</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={7} className={styles.empty}>Aucune anomalie détectée pour cette période. Excellent travail !</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 🚀 MODAL DE CONTESTATION */}
        {isContestModalOpen && selectedRow && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  Contester la Pénalité
                </h2>
              </div>
              <form onSubmit={handleContestSubmit}>
                <div className={styles.formGroup}>
                  <label>Référence du Dossier</label>
                  <input type="text" value={selectedRow.reference} disabled style={{ background: '#f1f5f9', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold' }} />
                </div>
                <div className={styles.formGroup}>
                  <label>Motif de la contestation *</label>
                  <textarea 
                    required 
                    placeholder="Expliquez pourquoi cette pénalité n'est pas justifiée..." 
                    value={motif} 
                    onChange={e => setMotif(e.target.value)} 
                  />
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnCancel} onClick={() => setIsContestModalOpen(false)}>Annuler</button>
                  <button type="submit" className={styles.btnSave} disabled={actionLoading}>
                    {actionLoading ? 'Envoi...' : 'Soumettre'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 🚀 MODAL CYCLE DE VIE (TIMELINE) */}
        {isDetailsModalOpen && selectedRow && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Cycle de vie de l'anomalie
                </h2>
              </div>
              
              <div className={styles.timeline}>
                {/* Etape 1 : Détection */}
                <div className={styles.timelineItem}>
                  <div className={`${styles.timelineDot} ${styles.primary}`}>✓</div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineDate}>Mois de facturation : {selectedRow.anMois || `${month}/${year}`}</div>
                    <strong>Anomalie Détectée ({activeTab})</strong>
                    <p>Impact estimé : <span style={{color: '#ef4444', fontWeight: 'bold'}}>{selectedRow.mtSst} €</span></p>
                  </div>
                </div>

                {/* Etape 2 : Contestation */}
                {selectedRow.statutContestation !== 'NON_CONTESTE' && selectedRow.statutContestation && (
                  <div className={styles.timelineItem}>
                    <div className={`${styles.timelineDot} ${styles.warning}`}>!</div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineDate}>
                        {selectedRow.dateContestation ? new Date(selectedRow.dateContestation).toLocaleString('fr-FR') : 'Date inconnue'}
                      </div>
                      <strong>Contestation Soumise</strong>
                      <p>"{selectedRow.motifContestation}"</p>
                    </div>
                  </div>
                )}

                {/* Etape 3 : Décision */}
                {(selectedRow.statutContestation === 'ACCEPTE' || selectedRow.statutContestation === 'REFUSE') && (
                  <div className={styles.timelineItem}>
                    <div className={`${styles.timelineDot} ${selectedRow.statutContestation === 'ACCEPTE' ? styles.success : styles.danger}`}>
                      {selectedRow.statutContestation === 'ACCEPTE' ? '✓' : '✗'}
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineDate}>Décision du Centre d'Arbitrage</div>
                      <strong style={{ color: selectedRow.statutContestation === 'ACCEPTE' ? '#10b981' : '#ef4444' }}>
                        {selectedRow.statutContestation === 'ACCEPTE' ? 'Contestation Acceptée (Pénalité annulée)' : 'Contestation Refusée (Pénalité maintenue)'}
                      </strong>
                      {selectedRow.reponseAdmin ? <p>"{selectedRow.reponseAdmin}"</p> : <p>Aucun commentaire de l'arbitre.</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setIsDetailsModalOpen(false)}>Fermer</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}