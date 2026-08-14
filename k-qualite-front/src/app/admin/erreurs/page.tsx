"use client";

import { useEffect, useState } from 'react';
import { getAdminErreurs, getAdminPartenaires } from '@/services/apiService';
import { ErreurResponseDTO, PartenaireDTO } from '@/types/api';
import Link from 'next/link';
import styles from '../../erreurs/Erreurs.module.css'; // Kan-khedmou b nfs CSS

export default function AdminErreursPage() {
  const [erreurs, setErreurs] = useState<ErreurResponseDTO[]>([]);
  const [partenaires, setPartenaires] = useState<PartenaireDTO[]>([]);
  const [selectedPartenaire, setSelectedPartenaire] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminPartenaires().then(setPartenaires).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    getAdminErreurs(selectedPartenaire)
      .then(setErreurs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedPartenaire]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'inline-block', backgroundColor: '#2c3e50', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>ESPACE ADMIN</div>
        <h1>Suivi Global des Erreurs</h1>
        <p>Consultez toutes les erreurs importées et filtrez par partenaire.</p>
      </header>

      <div style={{ display: 'flex', gap: '15px', background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '30px', alignItems: 'center' }}>
        <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }}>Filtrer par Partenaire :</label>
        <select 
          value={selectedPartenaire} 
          onChange={e => setSelectedPartenaire(e.target.value)} 
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', minWidth: '250px' }}
        >
          <option value="ALL">Tous les partenaires</option>
          {partenaires.map(p => <option key={p.id} value={p.id}>{p.nomEntreprise}</option>)}
        </select>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>Chargement des erreurs...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Partenaire</th>
                <th>Dossier</th>
                <th>Date</th>
                <th>Technicien</th>
                <th>Erreur</th>
                <th>Impact</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {erreurs.map((erreur) => (
                <tr key={erreur.id}>
                  <td style={{ fontWeight: 'bold', color: '#2c3e50' }}>{erreur.partenaireNom}</td>
                  <td className={styles.reference}>{erreur.dossierReference}</td>
                  <td>{new Date(erreur.dateDetection).toLocaleDateString()}</td>
                  <td>{erreur.technicienNomComplet}</td>
                  <td>{erreur.regleDescription}</td>
                  <td className={styles.impact}>{erreur.impactEstime} €</td>
                  <td>
                    <span className={`${styles.badge} ${styles[erreur.statut.toLowerCase()]}`}>
                      {erreur.statut}
                    </span>
                  </td>
                  <td>
                    <Link href={`/erreurs/${erreur.id}`} className={styles.actionBtn}>
                      Détails
                    </Link>
                  </td>
                </tr>
              ))}
              {erreurs.length === 0 && (
                <tr>
                  <td colSpan={8} className={styles.empty}>Aucune erreur trouvée.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}