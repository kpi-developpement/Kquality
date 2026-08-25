"use client"; 

import { useEffect, useState, useMemo, useRef } from 'react';
import { getAllContestations, traiterContestation } from '@/services/apiService';
import { ContestationResponseDTO } from '@/types/api'; 
import * as XLSX from 'xlsx'; // 🚀 L'FIX HWA HNA: Librairie Excel
import InteractiveCard from './vue-globale/components/InteractiveCard/InteractiveCard'; 
import CustomSelect from './vue-globale/components/CustomSelect/CustomSelect'; 
import styles from './Admin.module.css';

const ITEMS_PER_PAGE = 8;

export default function AdminContestationsPage() {
  const [contestations, setContestations] = useState<ContestationResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [filterType, setFilterType] = useState('ALL');
  const [filterStatut, setFilterStatut] = useState('EN_ATTENTE');

  // 🚀 STATES IMPORT/EXPORT
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const fetchContestations = async () => {
    try {
      const data = await getAllContestations();
      setContestations(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContestations();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterStatut]);

  const handleTraitement = async (type: string, id: number, accepter: boolean) => {
    const commentaire = prompt(`Veuillez saisir un commentaire pour ${accepter ? 'ACCEPTER' : 'REFUSER'} cette contestation:`);
    if (commentaire === null) return; 

    try {
      await traiterContestation(type, id, accepter, commentaire);
      alert(`Contestation ${accepter ? 'acceptée' : 'refusée'} avec succès !`);
      fetchContestations(); 
    } catch (error) {
      alert("Erreur lors du traitement");
    }
  };

  // ==========================================
  // 🚀 LOGIQUE EXPORT EXCEL (ADMIN)
  // ==========================================
  const handleExport = () => {
    // On exporte uniquement les données filtrées (ex: celles EN_ATTENTE)
    const dataToExport = filteredContestations.map(c => ({
      'ID Contestation': c.id,
      'Type': c.type,
      'Partenaire': c.partenaireNom,
      'Dossier (EPS)': c.dossierReference,
      'Motif Partenaire': c.motif,
      'Argumentaire Partenaire': c.commentaire,
      'Impact (€)': c.impactEstime,
      'Statut Actuel': c.statut,
      'Décision (ACCEPTER/REFUSER)': '', // Colonne à remplir par l'Admin
      'Commentaire Admin': ''            // Colonne à remplir par l'Admin
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Arbitrage");
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Export_Arbitrage_${date}.xlsx`);
  };

  // ==========================================
  // 🚀 LOGIQUE IMPORT EXCEL (BATCH TRAITEMENT)
  // ==========================================
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);

      const queue: any[] = [];

      data.forEach((row: any) => {
        const id = row['ID Contestation'];
        const type = row['Type'];
        const decision = row['Décision (ACCEPTER/REFUSER)']?.toString().trim().toUpperCase();
        const comment = row['Commentaire Admin'] || '';

        if (id && type && (decision === 'ACCEPTER' || decision === 'REFUSER')) {
          queue.push({ 
            id: Number(id), 
            type: String(type), 
            isAccepted: decision === 'ACCEPTER', 
            comment: String(comment) 
          });
        }
      });

      if (queue.length > 0) {
        setBatchLoading(true);
        let success = 0;
        let failed = 0;

        for (const item of queue) {
          try {
            await traiterContestation(item.type, item.id, item.isAccepted, item.comment);
            success++;
          } catch (err) {
            failed++;
          }
        }

        setBatchLoading(false);
        alert(`Arbitrage par lot terminé !\n✅ Traités avec succès : ${success}\n❌ Échecs : ${failed}`);
        fetchContestations(); // Rafraîchir le tableau
      } else {
        alert("Aucune décision valide (ACCEPTER/REFUSER) trouvée dans le fichier.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 🛡️ Filtrage
  const filteredContestations = useMemo(() => {
    return contestations.filter(c => {
      const matchType = filterType === 'ALL' || c.type === filterType;
      const matchStatut = filterStatut === 'ALL' || c.statut === filterStatut;
      return matchType && matchStatut;
    });
  }, [contestations, filterType, filterStatut]);

  const totalEnAttente = contestations.filter(c => c.statut === 'EN_ATTENTE').length;
  const impactBloque = contestations.filter(c => c.statut === 'EN_ATTENTE').reduce((acc, c) => acc + (c.impactEstime || 0), 0);

  const totalPages = Math.ceil(filteredContestations.length / ITEMS_PER_PAGE);
  const paginatedContestations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredContestations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredContestations, currentPage]);

  const typeOptions = [
    { value: 'ALL', label: 'Tous les types' },
    { value: 'ERREUR', label: 'Erreurs Classiques' },
    { value: 'PENALITE_CQ', label: 'Pénalités CQ' }
  ];

  const statutOptions = [
    { value: 'ALL', label: 'Tous les statuts' },
    { value: 'EN_ATTENTE', label: 'En Attente' },
    { value: 'ACCEPTE', label: 'Acceptées' },
    { value: 'REFUSE', label: 'Refusées' }
  ];

  const IconAlert = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
  const IconLock = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      {/* 🚀 LOADING OVERLAY POUR LE BATCH */}
      {batchLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <h2>Arbitrage par lot en cours</h2>
          <p>Le système enregistre vos décisions. Veuillez patienter...</p>
        </div>
      )}

      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <div className={styles.adminBadge}>CENTRE D'ARBITRAGE</div>
            <h1>Gestion des Contestations</h1>
            <p>Traitez les réclamations des partenaires avant la clôture mensuelle.</p>
            
            {/* 🚀 BOUTONS EXPORT / IMPORT POUR L'ADMIN */}
            <div className={styles.actionHeaderGroup}>
              <button className={styles.btnExport} onClick={handleExport}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Exporter la liste (Excel)
              </button>
              <button className={styles.btnImport} onClick={() => fileInputRef.current?.click()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Importer les Décisions
              </button>
              <input type="file" accept=".xlsx,.xls" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
            </div>
          </div>
          
          <div className={styles.filtersWrapper}>
            <div className={styles.filterLabel}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Filtres
            </div>
            <CustomSelect value={filterType} options={typeOptions} onChange={setFilterType} width="200px" />
            <CustomSelect value={filterStatut} options={statutOptions} onChange={setFilterStatut} width="180px" />
          </div>
        </header>

        <div className={styles.kpiGrid}>
          <InteractiveCard delayIndex={1}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#fffbeb', color: '#f59e0b' }}>{IconAlert}</div>
                <h3 className={styles.kpiTitle}>Dossiers en Attente</h3>
              </div>
              <p className={styles.kpiValue}>{totalEnAttente}</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={2}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#fef2f2', color: '#ef4444' }}>{IconLock}</div>
                <h3 className={styles.kpiTitle}>Impact Financier Bloqué</h3>
              </div>
              <p className={styles.kpiValue} style={{ color: '#ef4444' }}>{impactBloque.toLocaleString('fr-FR')} €</p>
            </div>
          </InteractiveCard>
        </div>

        <div className={styles.tableWrapper}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Chargement de l'espace d'arbitrage...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Partenaire</th>
                  <th>Type</th>
                  <th>Dossier</th>
                  <th>Motif Soulevé</th>
                  <th>Argumentaire Partenaire</th>
                  <th>Impact</th>
                  <th>Statut</th>
                  <th>Arbitrage</th>
                </tr>
              </thead>
              <tbody>
                {paginatedContestations.map((c, index) => (
                  <tr key={`${c.type}-${c.id}-${currentPage}`} className={styles.tableRow} style={{ animationDelay: `${index * 0.05}s` }}>
                    <td className={styles.bold}>
                       <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#3b82f6', display:'inline-block', marginRight:'8px' }}></span>
                       {c.partenaireNom}
                    </td>
                    <td>
                      <span className={c.type === 'ERREUR' ? styles.typeErreur : styles.typeCq}>
                        {c.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td><span className={styles.reference}>{c.dossierReference}</span></td>
                    <td><span className={styles.motifBadge}>{c.motif.replace('_', ' ')}</span></td>
                    <td className={styles.commentCell} title={c.commentaire}>{c.commentaire || '-'}</td>
                    <td className={styles.impact}>{c.impactEstime} €</td>
                    <td>
                      <span className={`${styles.statutBadge} ${styles[c.statut.toLowerCase()]}`}>
                        {c.statut.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {c.statut === 'EN_ATTENTE' ? (
                        <div className={styles.actionsBox}>
                          <button onClick={() => handleTraitement(c.type, c.id, true)} className={styles.btnAccept}>Accepter</button>
                          <button onClick={() => handleTraitement(c.type, c.id, false)} className={styles.btnReject}>Refuser</button>
                        </div>
                      ) : (
                        <div className={styles.reponseAdmin} title={c.reponseAdmin}>
                          {c.reponseAdmin ? `"${c.reponseAdmin}"` : '-'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {paginatedContestations.length === 0 && (
                  <tr>
                    <td colSpan={8} className={styles.empty}>Aucune contestation trouvée pour ces filtres.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className={styles.paginationWrapper}>
            <span className={styles.pageInfo}>
              Affichage {((currentPage - 1) * ITEMS_PER_PAGE) + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, filteredContestations.length)} sur {filteredContestations.length}
            </span>
            <div className={styles.pageControls}>
              <button 
                className={styles.pageBtn} 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >&lt;</button>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return <button key={page} className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>;
                }
                if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} style={{ color: '#94a3b8', padding: '0 5px' }}>...</span>;
                return null;
              })}

              <button 
                className={styles.pageBtn} 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >&gt;</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}