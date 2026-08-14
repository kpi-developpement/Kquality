"use client";

import { useState, useRef } from 'react';
import { importErreursExcel, importMultiCqExcel } from '@/services/apiService';
import styles from './Import.module.css';

export default function ImportErreursPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState("");
  
  // 🛡️ L'FIX HWA HNA: State dyal Mois w Année
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fileInputErreursRef = useRef<HTMLInputElement>(null);
  const fileInputMultiRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.adminBadge}>DISPATCHER</div>
        <h1>Importation des Données</h1>
        <p>Injectez les fichiers. Le système distribuera automatiquement les lignes aux bons partenaires via le KYN.</p>
      </header>

      {/* 🛡️ JDID: Sélecteur de période */}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className={styles.uploadBox} onClick={() => !loading && fileInputErreursRef.current?.click()}>
          <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputErreursRef} onChange={handleUploadErreurs} className={styles.fileInput} />
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#e74c3c" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          <h3 style={{ color: '#c0392b' }}>1. Fichier des Erreurs</h3>
          <p style={{ color: '#7f8c8d', fontSize: '13px' }}>Contient: ID RDV, KYN, Categorie, Impact</p>
        </div>

        <div className={styles.uploadBox} onClick={() => !loading && fileInputMultiRef.current?.click()}>
          <input type="file" accept=".xlsx,.xls" ref={fileInputMultiRef} onChange={handleUploadMultiCq} className={styles.fileInput} />
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#27ae60" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          <h3 style={{ color: '#27ae60' }}>2. Fichier Multi-Feuilles CQ</h3>
          <p style={{ color: '#7f8c8d', fontSize: '13px' }}>Audits, Voisinage, Expertises, Coupures</p>
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