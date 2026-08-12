"use client"; 

import { useEffect, useState } from 'react';
import { getContestationsEnAttente, traiterContestation } from '@/services/apiService';
import { ContestationResponseDTO } from '@/types/api'; // 🛡️ L'FIX HWA HNA: Jbnaha mn types/api
import Link from 'next/link';
import styles from './Admin.module.css';

export default function AdminContestationsPage() {
  const [contestations, setContestations] = useState<ContestationResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContestations = async () => {
    try {
      const data = await getContestationsEnAttente();
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

  const handleTraitement = async (id: number, accepter: boolean) => {
    const commentaire = prompt(`Veuillez saisir un commentaire pour ${accepter ? 'ACCEPTER' : 'REFUSER'} cette contestation:`);
    if (commentaire === null) return; 

    try {
      await traiterContestation(id, accepter, commentaire);
      alert(`Contestation ${accepter ? 'acceptée' : 'refusée'} avec succès !`);
      fetchContestations(); 
    } catch (error) {
      alert("Erreur lors du traitement");
    }
  };

  if (loading) return <div className={styles.container}>Chargement de l'espace Admin...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className={styles.adminBadge}>ESPACE KYNTUS</div>
          <h1>Gestion des Contestations</h1>
          <p>Traitez les réclamations des partenaires avant la clôture mensuelle.</p>
        </div>
        <Link href="/admin/vue-globale" className={styles.btnAccept} style={{ textDecoration: 'none', background: '#3498db' }}>
          📊 Consulter la Vue Globale KPI
        </Link>
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Partenaire</th>
              <th>Dossier</th>
              <th>Motif</th>
              <th>Commentaire Partenaire</th>
              <th>Montant</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {contestations.map((c) => (
              <tr key={c.id}>
                <td className={styles.bold}>{c.partenaireNom}</td>
                <td>{c.dossierReference}</td>
                <td><span className={styles.motifBadge}>{c.motif}</span></td>
                <td className={styles.commentCell}>{c.commentaire || '-'}</td>
                <td className={styles.impact}>{c.impactEstime} €</td>
                <td className={styles.actionsBox}>
                  <button onClick={() => handleTraitement(c.id, true)} className={styles.btnAccept}>
                    Accepter
                  </button>
                  <button onClick={() => handleTraitement(c.id, false)} className={styles.btnReject}>
                    Refuser
                  </button>
                </td>
              </tr>
            ))}
            {contestations.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.empty}>Aucune contestation en attente. Bon travail !</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}