"use client";

import React, { useEffect, useState } from 'react';
import { getErreurs } from '@/services/apiService';
import { ErreurResponseDTO } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import ContestationForm from '../ContestationForm'; 
import Link from 'next/link';
import styles from './ErreurDetail.module.css';

export default function ErreurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // F Next.js 15+, params hya Promise, khassna n-diro liha React.use() f Client Component
  const resolvedParams = React.use(params);
  const urlId = resolvedParams.id;

  const { user } = useAuth();
  const [erreur, setErreur] = useState<ErreurResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchErreurDetails = async () => {
    // 🛡️ L'FIX HWA HNA: Kan-jbdou l'ID dyal l'partenaire m-connecté
    if (!user?.partenaireId) return;
    
    try {
      setLoading(true);
      const erreurs = await getErreurs(user.partenaireId);
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

  // Mli l'partenaire y-sifet l'contestation b naja7, kan-refreshiw data
  const handleSuccess = () => {
    fetchErreurDetails();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '50px', color: '#7f8c8d' }}>
          Chargement des détails de l'erreur...
        </div>
      </div>
    );
  }

  if (notFound || !erreur) {
    return (
      <div className={styles.container}>
        <Link href="/erreurs" className={styles.backLink}>&larr; Retour à la liste</Link>
        <div style={{ textAlign: 'center', padding: '50px', background: '#ffebee', borderRadius: '8px', color: '#c62828' }}>
          <h1>Erreur introuvable</h1>
          <p>Cette erreur n'existe pas ou n'appartient pas à votre entreprise.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/erreurs" className={styles.backLink}>&larr; Retour à la liste</Link>
      
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
            <li><strong>Technicien:</strong> {erreur.technicienNomComplet} ({erreur.technicienMatricule})</li>
            <li><strong>Date d'intervention:</strong> {new Date(erreur.dossierDateIntervention).toLocaleDateString()}</li>
            <li><strong>Date de détection:</strong> {new Date(erreur.dateDetection).toLocaleString()}</li>
            <li><strong>Échéance contestation:</strong> {new Date(erreur.echeanceContestation).toLocaleString()}</li>
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

      {/* Formulaire de contestation */}
      {erreur.statut === 'NOUVEAU' || erreur.statut === 'A_ANALYSER' ? (
        <ContestationForm erreurId={erreur.id} onSuccess={handleSuccess} />
      ) : (
        <div className={styles.lockedMessage}>
          Cette erreur est verrouillée (Statut: {erreur.statut}). Vous ne pouvez plus la contester.
        </div>
      )}
    </div>
  );
}