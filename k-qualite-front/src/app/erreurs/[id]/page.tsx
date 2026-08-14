"use client";

import React, { useEffect, useState } from 'react';
import { getErreurs, getAdminErreurs } from '@/services/apiService';
import { ErreurResponseDTO } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import ContestationForm from '../ContestationForm'; 
import Link from 'next/link';
import styles from './ErreurDetail.module.css';

export default function ErreurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const urlId = resolvedParams.id;

  const { user } = useAuth();
  const [erreur, setErreur] = useState<ErreurResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchErreurDetails = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // 🛡️ L'FIX HWA HNA: TypeScript db 3aref chno kayn f had l'tableau
      let erreurs: ErreurResponseDTO[] = [];
      
      if (user.role === 'ADMIN') {
        erreurs = await getAdminErreurs("ALL");
      } else if (user.partenaireId) {
        erreurs = await getErreurs(user.partenaireId);
      }

      const found = erreurs.find(e => e.id.toString() === urlId);
      
      if (found) {
        setErreur(found);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErreurDetails();
  }, [user, urlId]);

  const handleSuccess = () => {
    fetchErreurDetails();
  };

  if (loading) return <div className={styles.container}><div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div></div>;
  if (notFound || !erreur) return <div className={styles.container}><h1>Erreur introuvable</h1></div>;

  const isExpired = new Date() > new Date(erreur.echeanceContestation);
  const canContest = user?.role === 'PARTENAIRE' && !isExpired && (erreur.statut === 'NOUVEAU' || erreur.statut === 'A_ANALYSER');

  return (
    <div className={styles.container}>
      <Link href={user?.role === 'ADMIN' ? "/admin/erreurs" : "/erreurs"} className={styles.backLink}>&larr; Retour à la liste</Link>
      
      <div className={styles.headerBox}>
        <div className={styles.headerLeft}>
          <h1>Dossier : {erreur.dossierReference}</h1>
          <p className={styles.regle}>{erreur.regleDescription}</p>
        </div>
        <div className={styles.headerRight}>
          <span className={`${styles.badge} ${styles[erreur.statut.toLowerCase()]}`}>{erreur.statut}</span>
          <h2 className={styles.impact}>{erreur.impactEstime} €</h2>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.infoCard}>
          <h3>Détails de l'intervention</h3>
          <ul>
            {user?.role === 'ADMIN' && <li style={{ color: '#1976d2', fontWeight: 'bold' }}>Partenaire: {erreur.partenaireNom}</li>}
            <li><strong>Technicien:</strong> {erreur.technicienNomComplet} ({erreur.technicienMatricule})</li>
            <li><strong>Date d'intervention:</strong> {new Date(erreur.dossierDateIntervention).toLocaleDateString()}</li>
            <li><strong>Date de détection:</strong> {new Date(erreur.dateDetection).toLocaleString()}</li>
            <li>
              <strong>Échéance contestation:</strong> {new Date(erreur.echeanceContestation).toLocaleString()}
              {isExpired && <span style={{ color: '#e74c3c', marginLeft: '10px', fontWeight: 'bold' }}>(Délai dépassé)</span>}
            </li>
          </ul>
        </div>
        
        <div className={styles.infoCard}>
          <h3>Preuve de l'erreur</h3>
          {erreur.preuveUrl ? (
             // eslint-disable-next-line @next/next/no-img-element
            <img src={erreur.preuveUrl} alt="Preuve de l'erreur" className={styles.preuveImg} />
          ) : (
            <div className={styles.noPreuve}>Aucune preuve photo disponible.</div>
          )}
        </div>
      </div>

      {canContest ? (
        <ContestationForm erreurId={erreur.id} onSuccess={handleSuccess} />
      ) : user?.role === 'PARTENAIRE' ? (
        <div className={styles.lockedMessage} style={{ borderColor: isExpired ? '#e74c3c' : '#7f8c8d', backgroundColor: isExpired ? '#fdfefe' : '#f1f2f6' }}>
          {isExpired 
            ? "Le délai de 15 jours pour contester cette erreur est dépassé. L'action est désormais verrouillée." 
            : `Cette erreur est verrouillée (Statut: ${erreur.statut}). Vous ne pouvez plus la contester.`}
        </div>
      ) : null}
    </div>
  );
}