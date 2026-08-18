"use client";

import { useState, useRef } from 'react';
import { importErreursExcel, importMultiCqExcel, importCqPartenaireExcel, importSacliPartenaireExcel, importSarcliPartenaireExcel, importIncoherencePtoExcel, importGemNokExcel } from '@/services/apiService';
import styles from './Import.module.css';

export default function ImportErreursPage() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState("");
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fileInputErreursRef = useRef<HTMLInputElement>(null);
  const fileInputMultiRef = useRef<HTMLInputElement>(null);
  const fileInputCqPartenaireRef = useRef<HTMLInputElement>(null);
  const fileInputSacliRef = useRef<HTMLInputElement>(null);
  const fileInputSarcliRef = useRef<HTMLInputElement>(null);
  const fileInputPtoRef = useRef<HTMLInputElement>(null);
  const fileInputGemRef = useRef<HTMLInputElement>(null);

  const handleUploadErreurs = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setLoading(true); setError(""); setSummary(null);
    try {
      const res = await importErreursExcel(e.target.files[0]);
      setSummary({ type: 'Erreurs Classiques', data: res.data });
    } catch (err: any) { setError(err.message); } 
    finally { setLoading(false); if(fileInputErreursRef.current) fileInputErreursRef.current.value = ""; }
  };

  const handleUploadMultiCq = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setLoading(true); setError(""); setSummary(null);
    try {
      const res = await importMultiCqExcel(e.target.files[0], month, year);
      setSummary({ type: 'Fichier Multi-Feuilles CQ', data: res.data });
    } catch (err: any) { setError(err.message); } 
    finally { setLoading(false); if(fileInputMultiRef.current) fileInputMultiRef.current.value = ""; }
  };

  const handleUploadCqPartenaire = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setLoading(true); setError(""); setSummary(null);
    try {
      const res = await importCqPartenaireExcel(e.target.files[0], month, year);
      setSummary({ type: 'Calculs CQ Partenaire (PLP, Hotline...)', data: res.data });
    } catch (err: any) { setError(err.message); } 
    finally { setLoading(false); if(fileInputCqPartenaireRef.current) fileInputCqPartenaireRef.current.value = ""; }
  };

  const handleUploadSacli = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setLoading(true); setError(""); setSummary(null);
    try {
      const res = await importSacliPartenaireExcel(e.target.files[0], month, year);
      setSummary({ type: 'Calculs SACLI OK', data: res.data });
    } catch (err: any) { setError(err.message); } 
    finally { setLoading(false); if(fileInputSacliRef.current) fileInputSacliRef.current.value = ""; }
  };

  const handleUploadSarcli = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setLoading(true); setError(""); setSummary(null);
    try {
      const res = await importSarcliPartenaireExcel(e.target.files[0], month, year);
      setSummary({ type: 'Calculs SARCLI NOK', data: res.data });
    } catch (err: any) { setError(err.message); } 
    finally { setLoading(false); if(fileInputSarcliRef.current) fileInputSarcliRef.current.value = ""; }
  };

  const handleUploadPto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setLoading(true); setError(""); setSummary(null);
    try {
      const res = await importIncoherencePtoExcel(e.target.files[0], month, year);
      setSummary({ type: 'Incohérence PTO', data: res.data });
    } catch (err: any) { setError(err.message); } 
    finally { setLoading(false); if(fileInputPtoRef.current) fileInputPtoRef.current.value = ""; }
  };

  const handleUploadGem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setLoading(true); setError(""); setSummary(null);
    try {
      const res = await importGemNokExcel(e.target.files[0], month, year);
      setSummary({ type: 'GEM NOK', data: res.data });
    } catch (err: any) { setError(err.message); } 
    finally { setLoading(false); if(fileInputGemRef.current) fileInputGemRef.current.value = ""; }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.adminBadge}>DISPATCHER</div>
        <h1>Importation des Données</h1>
        <p>Injectez les fichiers. Le système distribuera automatiquement les lignes aux bons partenaires via le KYN.</p>
      </header>

      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '30px', background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d' }}>MOIS CIBLE</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d' }}>ANNÉE CIBLE</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {error && <div style={{ color: 'red', background: '#ffebee', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        
        <div className={styles.uploadBox} onClick={() => !loading && fileInputErreursRef.current?.click()}>
          <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputErreursRef} onChange={handleUploadErreurs} className={styles.fileInput} />
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#e74c3c" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          <h3 style={{ color: '#c0392b' }}>1. Fichier des Erreurs</h3>
          <p style={{ color: '#7f8c8d', fontSize: '13px' }}>Contient: ID RDV, KYN, Categorie, Impact</p>
        </div>

        <div className={styles.uploadBox} onClick={() => !loading && fileInputMultiRef.current?.click()}>
          <input type="file" accept=".xlsx,.xls" ref={fileInputMultiRef} onChange={handleUploadMultiCq} className={styles.fileInput} />
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#27ae60" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          <h3 style={{ color: '#27ae60' }}>2. Multi-Feuilles CQ</h3>
          <p style={{ color: '#7f8c8d', fontSize: '13px' }}>Audits, Voisinage, Expertises, Coupures</p>
        </div>

        <div className={styles.uploadBox} onClick={() => !loading && fileInputCqPartenaireRef.current?.click()}>
          <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputCqPartenaireRef} onChange={handleUploadCqPartenaire} className={styles.fileInput} />
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#f39c12" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <h3 style={{ color: '#e67e22' }}>3. CQ Partenaire</h3>
          <p style={{ color: '#7f8c8d', fontSize: '13px' }}>Calculs PLP, Hotline, Construction, Rang 2</p>
        </div>

        <div className={styles.uploadBox} onClick={() => !loading && fileInputSacliRef.current?.click()}>
          <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputSacliRef} onChange={handleUploadSacli} className={styles.fileInput} />
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#8e44ad" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
          <h3 style={{ color: '#8e44ad' }}>4. SACLI OK</h3>
          <p style={{ color: '#7f8c8d', fontSize: '13px' }}>Calculs SACLI (valr not glbl = 5)</p>
        </div>

        <div className={styles.uploadBox} onClick={() => !loading && fileInputSarcliRef.current?.click()}>
          <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputSarcliRef} onChange={handleUploadSarcli} className={styles.fileInput} />
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#d35400" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <h3 style={{ color: '#d35400' }}>5. SARCLI NOK</h3>
          <p style={{ color: '#7f8c8d', fontSize: '13px' }}>Calculs SARCLI (valr not glbl = 4 ou 5)</p>
        </div>

        {/* 🛡️ L'FIX HWA HNA: Boxes jdad l'PTO w GEM NOK */}
        <div className={styles.uploadBox} onClick={() => !loading && fileInputPtoRef.current?.click()}>
          <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputPtoRef} onChange={handleUploadPto} className={styles.fileInput} />
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#9b59b6" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <h3 style={{ color: '#8e44ad' }}>6. Incohérence PTO</h3>
          <p style={{ color: '#7f8c8d', fontSize: '13px' }}>Calculs PTO Magouille</p>
        </div>

        <div className={styles.uploadBox} onClick={() => !loading && fileInputGemRef.current?.click()}>
          <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputGemRef} onChange={handleUploadGem} className={styles.fileInput} />
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#e67e22" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
          <h3 style={{ color: '#d35400' }}>7. GEM NOK</h3>
          <p style={{ color: '#7f8c8d', fontSize: '13px' }}>Filtre TVC w Flg Gem</p>
        </div>

      </div>

      {loading && <div style={{ textAlign: 'center', marginTop: '20px', fontWeight: 'bold', color: '#3498db' }}>Analyse et distribution en cours...</div>}

      {summary && (
        <div className={styles.summaryCard}>
          <h3>✅ Importation réussie : {summary.type}</h3>
          <ul>
            <li>Total des lignes lues : {summary.data.totalLignes}</li>
            <li>Lignes insérées et distribuées : {summary.data.lignesInserees}</li>
            <li style={{ color: '#c62828' }}>Lignes rejetées (KYN introuvable) : {summary.data.lignesRejetees}</li>
          </ul>
        </div>
      )}
    </div>
  );
}