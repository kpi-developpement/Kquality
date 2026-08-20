"use client";

import { useState, useRef } from 'react';
import { 
  importErreursExcel, 
  importMultiCqExcel, 
  importCqPartenaireExcel, 
  importSacliPartenaireExcel, 
  importSarcliPartenaireExcel, 
  importIncoherencePtoExcel, 
  importGemNokExcel, 
  importCadrageExcel,
  importTauxPlainteExcel,
  importSavExcel
} from '@/services/apiService';
import CustomSelect from '../vue-globale/components/CustomSelect/CustomSelect'; // 🚀
import InteractiveCard from '../vue-globale/components/InteractiveCard/InteractiveCard'; // 🚀
import styles from './Import.module.css';

export default function ImportErreursPage() {
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState("");
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fileInputErreursRef = useRef<HTMLInputElement>(null);
  const fileInputMultiRef = useRef<HTMLInputElement>(null);
  const fileInputCqPartenaireRef = useRef<HTMLInputElement>(null);
  const fileInputSavRef = useRef<HTMLInputElement>(null);
  
  const fileInputSacliRef = useRef<HTMLInputElement>(null);
  const fileInputSarcliRef = useRef<HTMLInputElement>(null);
  const fileInputPtoRef = useRef<HTMLInputElement>(null);
  const fileInputGemRef = useRef<HTMLInputElement>(null);
  const fileInputCadrageRef = useRef<HTMLInputElement>(null);
  const fileInputPlainteRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    apiCall: Function, 
    typeName: string, 
    ref: React.RefObject<HTMLInputElement | null>
  ) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    setLoading(true); 
    setLoadingMsg(`Extraction et traitement de ${typeName}...`);
    setError(""); 
    setSummary(null);
    
    try {
      const res = typeName === 'Erreurs Classiques' 
        ? await apiCall(e.target.files[0])
        : await apiCall(e.target.files[0], month, year);
        
      setSummary({ type: typeName, data: res.data });
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
      if(ref.current) ref.current.value = ""; 
    }
  };

  const monthOptions = [1,2,3,4,5,6,7,8,9,10,11,12].map(m => ({ value: m, label: `Mois ${m}` }));
  const yearOptions = [2024, 2025, 2026, 2027].map(y => ({ value: y, label: y.toString() }));

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      <div className={styles.container}>
        
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <h2>Déploiement en cours</h2>
            <p>{loadingMsg}</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>Le système Kyntus distribue les lignes aux partenaires respectifs.</p>
          </div>
        )}

        <header className={styles.header}>
          <div className={styles.adminBadge}>DATA DISPATCHER AI</div>
          <h1>Moteur d'Importation</h1>
          <p>Injectez vos rapports Excel/CSV. Le système distribuera automatiquement et intelligemment les métriques aux partenaires via le matricule KYN.</p>
        </header>

        <div className={styles.controlPanel}>
          <div className={styles.filterGroup}>
            <label>Mois Cible</label>
            <CustomSelect value={month} options={monthOptions} onChange={setMonth} width="160px" />
          </div>
          <div className={styles.filterGroup}>
            <label>Année Cible</label>
            <CustomSelect value={year} options={yearOptions} onChange={setYear} width="140px" />
          </div>
        </div>

        {error && <div style={{ color: '#ef4444', background: 'rgba(254, 242, 242, 0.9)', padding: '20px', borderRadius: '16px', border: '1px solid #fecaca', marginBottom: '30px', fontWeight: '800', textAlign: 'center', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.1)', backdropFilter: 'blur(10px)' }}>⚠️ Erreur système : {error}</div>}

        {/* GROUP 1 */}
        <h2 className={styles.sectionTitle}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Sources Principales & Agrégeurs
        </h2>
        <div className={styles.grid}>
          
          <InteractiveCard delayIndex={1}>
            <div className={`${styles.uploadBox} ${styles.boxRed}`} onClick={() => fileInputErreursRef.current?.click()}>
              <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputErreursRef} onChange={(e) => handleUpload(e, importErreursExcel, 'Erreurs Classiques', fileInputErreursRef)} className={styles.fileInput} />
              <div className={styles.iconWrapper}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <h3 style={{ color: '#ef4444' }}>Matrice des Erreurs</h3>
              <p>ID RDV, KYN, Categorie, Impact (€)</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={2}>
            <div className={`${styles.uploadBox} ${styles.boxGreen}`} onClick={() => fileInputMultiRef.current?.click()}>
              <input type="file" accept=".xlsx,.xls" ref={fileInputMultiRef} onChange={(e) => handleUpload(e, importMultiCqExcel, 'Multi-Feuilles CQ', fileInputMultiRef)} className={styles.fileInput} />
              <div className={styles.iconWrapper}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <h3 style={{ color: '#10b981' }}>CQ Global (Multi-sheets)</h3>
              <p>Audits, Voisinage, Expertises, Coupures</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={3}>
            <div className={`${styles.uploadBox} ${styles.boxOrange}`} onClick={() => fileInputCqPartenaireRef.current?.click()}>
              <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputCqPartenaireRef} onChange={(e) => handleUpload(e, importCqPartenaireExcel, 'CQ Partenaire (Fichier 2)', fileInputCqPartenaireRef)} className={styles.fileInput} />
              <div className={styles.iconWrapper}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              </div>
              <h3 style={{ color: '#f59e0b' }}>CQ Partenaires (F2)</h3>
              <p>PLP, Hotline, Construction, Rang 2</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={4}>
            <div className={`${styles.uploadBox} ${styles.boxBlue}`} onClick={() => fileInputSavRef.current?.click()}>
              <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputSavRef} onChange={(e) => handleUpload(e, importSavExcel, 'Fichier SAV', fileInputSavRef)} className={styles.fileInput} />
              <div className={styles.iconWrapper}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <h3 style={{ color: '#3b82f6' }}>Indicateurs SAV</h3>
              <p>SATCLI, SECU, TNH SAV, CCR, PERF</p>
            </div>
          </InteractiveCard>

        </div>

        {/* GROUP 2 */}
        <h2 className={styles.sectionTitle}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#8b5cf6" strokeWidth="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          Indicateurs Isolés (RACC)
        </h2>
        <div className={styles.grid}>
          
          <InteractiveCard delayIndex={5}>
            <div className={`${styles.uploadBox} ${styles.boxPurple}`} onClick={() => fileInputSacliRef.current?.click()}>
              <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputSacliRef} onChange={(e) => handleUpload(e, importSacliPartenaireExcel, 'SACLI OK', fileInputSacliRef)} className={styles.fileInput} />
              <div className={styles.iconWrapper}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
              </div>
              <h3 style={{ color: '#8b5cf6' }}>SACLI (Positif)</h3>
              <p>Valeurs de notes globales = 5</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={6}>
            <div className={`${styles.uploadBox} ${styles.boxOrange}`} onClick={() => fileInputSarcliRef.current?.click()}>
              <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputSarcliRef} onChange={(e) => handleUpload(e, importSarcliPartenaireExcel, 'SARCLI NOK', fileInputSarcliRef)} className={styles.fileInput} />
              <div className={styles.iconWrapper}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <h3 style={{ color: '#f97316' }}>SARCLI (Négatif)</h3>
              <p>Valeurs de notes globales = 4 ou 5</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={7}>
            <div className={`${styles.uploadBox} ${styles.boxPink}`} onClick={() => fileInputPtoRef.current?.click()}>
              <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputPtoRef} onChange={(e) => handleUpload(e, importIncoherencePtoExcel, 'Incohérence PTO', fileInputPtoRef)} className={styles.fileInput} />
              <div className={styles.iconWrapper}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <h3 style={{ color: '#ec4899' }}>Fraudes PTO</h3>
              <p>Calculs et détections des Incohérences PTO</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={8}>
            <div className={`${styles.uploadBox} ${styles.boxRed}`} onClick={() => fileInputGemRef.current?.click()}>
              <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputGemRef} onChange={(e) => handleUpload(e, importGemNokExcel, 'GEM NOK', fileInputGemRef)} className={styles.fileInput} />
              <div className={styles.iconWrapper}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              </div>
              <h3 style={{ color: '#ef4444' }}>GEM NOK</h3>
              <p>Filtres TVC avec Flag GEM</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={9}>
            <div className={`${styles.uploadBox} ${styles.boxGreen}`} onClick={() => fileInputCadrageRef.current?.click()}>
              <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputCadrageRef} onChange={(e) => handleUpload(e, importCadrageExcel, 'CADRAGE', fileInputCadrageRef)} className={styles.fileInput} />
              <div className={styles.iconWrapper}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              </div>
              <h3 style={{ color: '#10b981' }}>Score Cadrage</h3>
              <p>Données MAL_CADREE (0 ou 1)</p>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={10}>
            <div className={`${styles.uploadBox} ${styles.boxBlue}`} onClick={() => fileInputPlainteRef.current?.click()}>
              <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputPlainteRef} onChange={(e) => handleUpload(e, importTauxPlainteExcel, 'TAUX DE PLAINTE', fileInputPlainteRef)} className={styles.fileInput} />
              <div className={styles.iconWrapper}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              </div>
              <h3 style={{ color: '#3b82f6' }}>Taux de Plainte</h3>
              <p>Calculs Volumes Tickets Qualité</p>
            </div>
          </InteractiveCard>

        </div>

        {/* --- SUMMARY SUCCESS CARD --- */}
        {summary && !loading && (
          <div className={styles.summaryCard}>
            <h3>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Succès de l'Extraction : {summary.type}
            </h3>
            <ul className={styles.summaryList}>
              <li className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Lignes Analysées</span>
                <span className={styles.summaryValue}>{summary.data.totalLignes.toLocaleString()}</span>
              </li>
              <li className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Insérées / Distribuées avec succès</span>
                <span className={`${styles.summaryValue} ${styles.valueSuccess}`}>{summary.data.lignesInserees.toLocaleString()}</span>
              </li>
              <li className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Rejetées (Matricule KYN Introuvable)</span>
                <span className={`${styles.summaryValue} ${summary.data.lignesRejetees > 0 ? styles.valueError : ''}`}>{summary.data.lignesRejetees.toLocaleString()}</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}