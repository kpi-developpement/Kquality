"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { getErreurs, deposerContestation } from '@/services/apiService';
import { ErreurResponseDTO } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import InteractiveCard from '../admin/vue-globale/components/InteractiveCard/InteractiveCard'; 
import * as XLSX from 'xlsx'; 
import styles from './Erreurs.module.css';

const ITEMS_PER_PAGE = 8;

const EXPORT_COLUMNS = [
  { id: 'dateDetection', label: 'Date Détection' },
  { id: 'technicienNomComplet', label: 'Technicien' },
  { id: 'categorie', label: 'Catégorie' },
  { id: 'regleDescription', label: 'Sous Catégorie' },
  { id: 'impactEstime', label: 'Impact (€)' },
  { id: 'statut', label: 'Statut' }
];

interface WizardItem {
  erreurId: number;
  eps: string;
  categorie: string;
  impact: number;
  analyse: string;
  needsPhoto: boolean;
  photoFile: File | null; // 🛡️ On stocke le fichier physique
}

export default function ErreursPage() {
  const { user } = useAuth();
  const [erreurs, setErreurs] = useState<ErreurResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedCols, setSelectedCols] = useState<string[]>(EXPORT_COLUMNS.map(c => c.id));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardQueue, setWizardQueue] = useState<WizardItem[]>([]);
  const [currentWizardIndex, setCurrentWizardIndex] = useState(0);
  const [batchLoading, setBatchLoading] = useState(false);
  
  // 🚀 DRAG & DROP STATES
  const [currentPhotoFile, setCurrentPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dropzoneInputRef = useRef<HTMLInputElement>(null);

  const fetchErreurs = () => {
    if (user?.partenaireId) {
      setLoading(true);
      getErreurs(user.partenaireId)
        .then(setErreurs)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { fetchErreurs(); }, [user]);

  const handleExport = () => {
    const dataToExport = erreurs.map(err => {
      const row: any = { 'Dossier (EPS)': err.dossierReference }; 
      
      if (selectedCols.includes('dateDetection')) row['Date Détection'] = new Date(err.dateDetection).toLocaleDateString();
      if (selectedCols.includes('technicienNomComplet')) row['Technicien'] = err.technicienNomComplet;
      if (selectedCols.includes('categorie')) row['Catégorie'] = err.categorie || 'N/A';
      if (selectedCols.includes('regleDescription')) row['Sous Catégorie'] = err.regleDescription;
      if (selectedCols.includes('impactEstime')) row['Impact (€)'] = err.impactEstime;
      if (selectedCols.includes('statut')) row['Statut'] = err.statut;
      
      row['Analyse (Votre réponse)'] = '';
      row['Preuve Photo (Mettre X)'] = ''; 
      
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contestations");
    
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    XLSX.writeFile(wb, `Export_Erreurs_${month}_${year}.xlsx`);
    setIsExportModalOpen(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const queue: WizardItem[] = [];

      data.forEach((row: any) => {
        const epsKey = Object.keys(row).find(k => k.toLowerCase().includes('dossier') || k.toLowerCase().includes('eps'));
        const analyseKey = Object.keys(row).find(k => k.toLowerCase().includes('analyse'));
        const photoKey = Object.keys(row).find(k => k.toLowerCase().includes('preuve') || k.toLowerCase().includes('photo'));

        if (epsKey && analyseKey) {
          const eps = row[epsKey];
          const analyse = row[analyseKey];
          
          const photoVal = photoKey ? String(row[photoKey]).trim().toLowerCase() : '';
          const needsPhoto = photoVal === 'x' || photoVal === 'oui' || photoVal === '1' || photoVal === 'true' || photoVal === 'vrai';

          if (analyse && analyse.trim() !== '') {
            const matchedErreur = erreurs.find(e => e.dossierReference === eps);
            if (matchedErreur && (matchedErreur.statut === 'NOUVEAU' || matchedErreur.statut === 'A_ANALYSER')) {
              queue.push({
                erreurId: matchedErreur.id,
                eps: matchedErreur.dossierReference,
                categorie: matchedErreur.categorie || 'N/A',
                impact: matchedErreur.impactEstime,
                analyse: analyse,
                needsPhoto: needsPhoto,
                photoFile: null
              });
            }
          }
        }
      });

      if (queue.length > 0) {
        setWizardQueue(queue);
        
        const firstPhotoIdx = queue.findIndex(q => q.needsPhoto);
        if (firstPhotoIdx !== -1) {
          setCurrentWizardIndex(firstPhotoIdx);
          resetDropzone();
          setIsWizardOpen(true);
        } else {
          submitBatch(queue);
        }
      } else {
        alert("Aucune analyse trouvée ou les dossiers sont déjà contestés/expirés.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 🚀 LOGIQUE DRAG & DROP
  const resetDropzone = () => {
    setCurrentPhotoFile(null);
    setPreviewUrl(null);
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setCurrentPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      alert("Veuillez sélectionner une image valide (JPG, PNG).");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleWizardNext = () => {
    const updatedQueue = [...wizardQueue];
    updatedQueue[currentWizardIndex].photoFile = currentPhotoFile;
    setWizardQueue(updatedQueue);

    const nextIdx = updatedQueue.findIndex((q, idx) => idx > currentWizardIndex && q.needsPhoto);
    
    if (nextIdx !== -1) {
      setCurrentWizardIndex(nextIdx);
      resetDropzone();
    } else {
      setIsWizardOpen(false);
      submitBatch(updatedQueue);
    }
  };

  const submitBatch = async (queue: WizardItem[]) => {
    setBatchLoading(true);
    let success = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        await deposerContestation(item.erreurId, "AUTRE", item.analyse, item.photoFile);
        success++;
      } catch (err) {
        failed++;
      }
    }

    setBatchLoading(false);
    alert(`Traitement par lot terminé !\n✅ Succès : ${success}\n❌ Échecs : ${failed}`);
    fetchErreurs(); 
  };

  const totalErreurs = erreurs.length;
  const impactGlobal = erreurs.reduce((acc, err) => acc + (err.impactEstime || 0), 0);
  const contestables = erreurs.filter(e => e.statut === 'NOUVEAU' || e.statut === 'A_ANALYSER').length;

  const totalPages = Math.ceil(totalErreurs / ITEMS_PER_PAGE);
  const paginatedErreurs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return erreurs.slice(start, start + ITEMS_PER_PAGE);
  }, [erreurs, currentPage]);

  const IconAlert = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
  const IconMoney = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
  const IconClock = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;

  if (loading) return <div className={styles.pageWrapper}><div style={{ textAlign: 'center', padding: '100px', fontWeight: 'bold', color: '#64748b' }}>Chargement sécurisé...</div></div>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      {batchLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <h2>Traitement par lot en cours</h2>
          <p>Le système injecte vos contestations et téléverse vos images. Veuillez patienter...</p>
        </div>
      )}

      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <div className={styles.partnerBadge}>PORTAIL QUALITÉ</div>
            <h1>Registre des Erreurs</h1>
            <p>Consultez et contestez les écarts détectés sur vos interventions.</p>
          </div>
          
          <div className={styles.actionHeaderGroup}>
            <button className={styles.btnExport} onClick={() => setIsExportModalOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Générer Excel d'Analyse
            </button>
            <button className={styles.btnImport} onClick={() => fileInputRef.current?.click()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Importer les Contestations
            </button>
            <input type="file" accept=".xlsx,.xls" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
          </div>
        </header>

        <div className={styles.kpiGrid}>
          <InteractiveCard delayIndex={1}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}>{IconAlert}</div>
                <h3 className={styles.kpiTitle}>Total Erreurs</h3>
              </div>
              <p className={styles.kpiValue}>{totalErreurs.toLocaleString('fr-FR')}</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={2}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#fef2f2', color: '#ef4444' }}>{IconMoney}</div>
                <h3 className={styles.kpiTitle}>Impact Financier Global</h3>
              </div>
              <p className={`${styles.kpiValue} ${styles.valueRed}`}>{impactGlobal.toLocaleString('fr-FR')} €</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={3}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIcon} style={{ background: '#fffbeb', color: '#f59e0b' }}>{IconClock}</div>
                <h3 className={styles.kpiTitle}>À Contester (Urgent)</h3>
              </div>
              <p className={styles.kpiValue} style={{ color: '#f59e0b' }}>{contestables}</p>
            </div>
          </InteractiveCard>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Dossier</th><th>Date</th><th>Technicien</th><th>Erreur</th><th>Impact</th><th>Échéance</th><th>Statut</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedErreurs.map((erreur, index) => {
                const isExpired = new Date() > new Date(erreur.echeanceContestation);
                return (
                  <tr key={`${erreur.id}-${currentPage}`} className={styles.tableRow} style={{ animationDelay: `${index * 0.05}s` }}>
                    <td><span className={styles.reference}>{erreur.dossierReference}</span></td>
                    <td style={{ fontWeight: '800', color: '#64748b' }}>{new Date(erreur.dateDetection).toLocaleDateString()}</td>
                    <td style={{ fontWeight: '800' }}>{erreur.technicienNomComplet}</td>
                    <td style={{ color: '#475569', fontWeight: '600' }}>{erreur.regleDescription}</td>
                    <td className={styles.impact}>{erreur.impactEstime} €</td>
                    <td style={{ fontWeight: '700', color: isExpired ? '#ef4444' : '#10b981' }}>
                      {new Date(erreur.echeanceContestation).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[erreur.statut.toLowerCase()] || styles.badge_default}`}>
                        {erreur.statut.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <Link href={`/erreurs/${erreur.id}`} className={styles.actionBtn}>Détails</Link>
                    </td>
                  </tr>
                );
              })}
              {paginatedErreurs.length === 0 && <tr><td colSpan={8} className={styles.empty}>Aucune anomalie détectée pour le moment.</td></tr>}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.paginationWrapper}>
            <span className={styles.pageInfo}>Affichage {((currentPage - 1) * ITEMS_PER_PAGE) + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, totalErreurs)} sur {totalErreurs}</span>
            <div className={styles.pageControls}>
              <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>&lt;</button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return <button key={page} className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>;
                }
                if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} style={{ color: '#94a3b8', padding: '0 5px' }}>...</span>;
                return null;
              })}
              <button className={styles.pageBtn} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>&gt;</button>
            </div>
          </div>
        )}

        {/* 🚀 MODAL EXPORT EXCEL */}
        {isExportModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Configuration de l'Export
                </h2>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '10px' }}>
                  Le fichier contiendra obligatoirement la colonne <strong>Dossier (EPS)</strong>, ainsi que les colonnes <strong>Analyse</strong> et <strong>Preuve Photo (Mettre X)</strong> pour vos réponses.
                </p>
              </div>
              
              <div className={styles.checkboxGrid}>
                {EXPORT_COLUMNS.map(col => (
                  <label key={col.id} className={styles.checkboxLabel}>
                    <input 
                      type="checkbox" 
                      checked={selectedCols.includes(col.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedCols([...selectedCols, col.id]);
                        else setSelectedCols(selectedCols.filter(id => id !== col.id));
                      }}
                    />
                    {col.label}
                  </label>
                ))}
              </div>

              <div className={styles.modalActions}>
                <button className={styles.btnCancel} onClick={() => setIsExportModalOpen(false)}>Annuler</button>
                <button className={styles.btnSave} onClick={handleExport}>Générer le fichier Excel</button>
              </div>
            </div>
          </div>
        )}

        {/* 🚀 WIZARD MODAL (DRAG AND DROP) */}
        {isWizardOpen && wizardQueue[currentWizardIndex] && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  Preuve Photographique Requise
                </h2>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '5px' }}>
                  Vous avez mis "X" dans la colonne Preuve Photo pour ce dossier.
                </p>
              </div>

              <div className={styles.wizardInfo}>
                <p>Dossier EPS : <span>{wizardQueue[currentWizardIndex].eps}</span></p>
                <p>Catégorie : <span style={{ color: '#0f172a' }}>{wizardQueue[currentWizardIndex].categorie}</span></p>
                <p>Impact : <span style={{ color: '#ef4444' }}>{wizardQueue[currentWizardIndex].impact} €</span></p>
              </div>

              <div className={styles.formGroup}>
                <label>Importer la preuve (Image) *</label>
                
                {previewUrl ? (
                  <div className={styles.previewContainer}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className={styles.previewImage} />
                    <button className={styles.removeBtn} onClick={resetDropzone} title="Supprimer l'image">✕</button>
                  </div>
                ) : (
                  <div 
                    className={`${styles.dropzone} ${isDragging ? styles.active : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => dropzoneInputRef.current?.click()}
                  >
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    <p>Glissez-déposez votre image ici</p>
                    <span>ou cliquez pour parcourir vos fichiers</span>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg" 
                      ref={dropzoneInputRef} 
                      style={{ display: 'none' }} 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button className={styles.btnNext} onClick={handleWizardNext} disabled={!currentPhotoFile}>
                  {wizardQueue.findIndex((q, idx) => idx > currentWizardIndex && q.needsPhoto) !== -1 
                    ? "Suivant" 
                    : "Terminer et Soumettre"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}