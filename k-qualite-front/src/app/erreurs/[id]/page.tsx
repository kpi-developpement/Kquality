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
      let erreurs: ErreurResponseDTO[] = [];
      if (user.role === 'ADMIN') erreurs = await getAdminErreurs("ALL");
      else if (user.partenaireId) erreurs = await getErreurs(user.partenaireId);

      const found = erreurs.find(e => e.id.toString() === urlId);
      if (found) setErreur(found);
      else setNotFound(true);
    } catch (error) {
      console.error(error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchErreurDetails(); }, [user, urlId]);
  const handleSuccess = () => { fetchErreurDetails(); };

  if (loading) return <div className={styles.pageWrapper}><div style={{ textAlign: 'center', padding: '100px', fontWeight: 'bold', color: '#64748b' }}>Analyse du dossier en cours...</div></div>;
  if (notFound || !erreur) return <div className={styles.pageWrapper}><div className={styles.container}><h1>Dossier introuvable ou accès refusé.</h1></div></div>;

  const isExpired = new Date() > new Date(erreur.echeanceContestation);
  const canContest = user?.role === 'PARTENAIRE' && !isExpired && (erreur.statut === 'NOUVEAU' || erreur.statut === 'A_ANALYSER');

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.container}>
        <Link href={user?.role === 'ADMIN' ? "/admin/erreurs" : "/erreurs"} className={styles.backLink}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Retour au Registre
        </Link>
        
        {/* 🚀 THE IMPACT VAULT HEADER */}
        <div className={styles.headerBox}>
          <div className={styles.headerLeft}>
            <span className={styles.dossierLabel}>Dossier d'Anomalie</span>
            <h1>{erreur.dossierReference}</h1>
            <p className={styles.regle}>{erreur.regleDescription}</p>
          </div>
          <div className={styles.headerRight}>
            <span className={`${styles.badge} ${styles[erreur.statut.toLowerCase()] || styles.badge_default}`}>
              STATUT : {erreur.statut.replace('_', ' ')}
            </span>
            <h2 className={styles.impact}>{erreur.impactEstime} €</h2>
          </div>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.infoCard}>
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              Métadonnées de l'Intervention
            </h3>
            <ul>
              {user?.role === 'ADMIN' && <li><strong>Partenaire</strong> <span style={{color:'#2563eb'}}>{erreur.partenaireNom}</span></li>}
              <li><strong>Technicien Assigné</strong> {erreur.technicienNomComplet} ({erreur.technicienMatricule})</li>
              <li><strong>Date d'intervention</strong> {new Date(erreur.dossierDateIntervention).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
              <li><strong>Date de détection (Audit)</strong> {new Date(erreur.dateDetection).toLocaleString('fr-FR')}</li>
              <li>
                <strong>Deadline de Contestation</strong> 
                <span style={{ color: isExpired ? '#ef4444' : '#10b981' }}>{new Date(erreur.echeanceContestation).toLocaleString('fr-FR')}</span>
              </li>
            </ul>
          </div>
          
          <div className={styles.infoCard}>
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              Preuve Photographique
            </h3>
            {erreur.preuveUrl ? (
              <div className={styles.preuveContainer}>
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={erreur.preuveUrl} alt="Preuve" className={styles.preuveImg} />
              </div>
            ) : (
              <div className={styles.noPreuve}>Le système n'a attaché aucune preuve visuelle pour ce dossier.</div>
            )}
          </div>
        </div>

        {canContest ? (
          <ContestationForm erreurId={erreur.id} onSuccess={handleSuccess} />
        ) : user?.role === 'PARTENAIRE' ? (
          <div className={styles.lockedMessage} style={{ borderColor: isExpired ? '#ef4444' : '#64748b' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            {isExpired 
              ? "Le délai légal de 15 jours pour contester cette erreur est dépassé. L'action est verrouillée par le système." 
              : `Dossier verrouillé. Statut actuel : ${erreur.statut.replace('_', ' ')}.`}
          </div>
        ) : null}
      </div>
    </div>
  );
}