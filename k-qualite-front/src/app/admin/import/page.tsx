"use client";

import { useState, useRef } from 'react';
import { importErreursExcel } from '@/services/apiService';
import styles from './Import.module.css';

export default function ImportErreursPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
      setSummary(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const res = await importErreursExcel(file);
      setSummary(res.data);
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.adminBadge}>DISPATCHER</div>
        <h1>Importation des Erreurs</h1>
        <p>Injectez le fichier contenant les KYN. Le système distribuera automatiquement les erreurs aux bons partenaires.</p>
      </header>

      {error && <div style={{ color: 'red', background: '#ffebee', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

      <div className={styles.uploadBox} onClick={() => fileInputRef.current?.click()}>
        <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputRef} onChange={handleFileChange} className={styles.fileInput} />
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#3498db" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        <h3>{file ? file.name : "Cliquez ou glissez un fichier ici"}</h3>
        <p style={{ color: '#7f8c8d', fontSize: '14px' }}>Fichiers supportés : CSV (séparateur point-virgule)</p>
      </div>

      <button className={styles.btnSubmit} onClick={handleUpload} disabled={!file || loading}>
        {loading ? "Analyse et distribution en cours..." : "Lancer l'importation"}
      </button>

      {summary && (
        <div className={styles.summaryCard}>
          <h3>✅ Importation réussie</h3>
          <ul>
            <li>Total des lignes lues : {summary.totalLignes}</li>
            <li>Erreurs insérées et distribuées : {summary.lignesInserees}</li>
            <li style={{ color: '#c62828' }}>Lignes rejetées (KYN introuvable) : {summary.lignesRejetees}</li>
          </ul>
        </div>
      )}
    </div>
  );
}