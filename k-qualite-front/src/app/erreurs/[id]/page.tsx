"use client";

import React, { useEffect, useState } from 'react';
import { getErreurById, getServerUrl } from '@/services/apiService'; 
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
      const found = await getErreurById(Number(urlId));
      setErreur(found);
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
        
        <div className={styles.headerBox}>
          <div className={styles.headerLeft}>
            <span className={styles.dossierLabel}>Dossier d'Anomalie</span>
            <h1>{erreur.dossierReference}</h1>
            
            <span className={styles.categorieBadge}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              {erreur.categorie || 'Catégorie non spécifiée'}
            </span>

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
              <li><strong>Catégorie Primaire</strong> {erreur.categorie || 'N/A'}</li>
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
                <img src={erreur.preuveUrl.startsWith('http') ? erreur.preuveUrl : `${getServerUrl()}${erreur.preuveUrl}`} alt="Preuve" className={styles.preuveImg} />
              </div>
            ) : (
              <div className={styles.noPreuve}>Le système n'a attaché aucune preuve visuelle pour ce dossier.</div>
            )}
          </div>
        </div>

        {/* 🚀 TIMELINE DU CYCLE DE VIE */}
        <div className={styles.timelineCard}>
          <h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Cycle de vie de l'anomalie
          </h3>
          
          <div className={styles.timeline}>
            {/* Etape 1 : Détection */}
            <div className={styles.timelineItem}>
              <div className={`${styles.timelineDot} ${styles.primary}`}>✓</div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineDate}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  {new Date(erreur.dateDetection).toLocaleString('fr-FR')}
                </div>
                <strong>Anomalie Détectée (Injection Kyntus)</strong>
                <p>Impact estimé : <span style={{color: '#ef4444', fontWeight: 'bold'}}>{erreur.impactEstime} €</span></p>
              </div>
            </div>

            {/* Etape 2 : Contestation */}
            {erreur.dateContestation && (
              <div className={styles.timelineItem}>
                <div className={`${styles.timelineDot} ${styles.warning}`}>!</div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineDate}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    {new Date(erreur.dateContestation).toLocaleString('fr-FR')}
                  </div>
                  <strong>Contestation Soumise par le Partenaire</strong>
                  <p style={{ color: '#0f172a', marginBottom: '5px' }}>Motif : {erreur.motifContestation.replace('_', ' ')}</p>
                  <p>"{erreur.commentaireContestation}"</p>
                </div>
              </div>
            )}

            {/* Etape 3 : Décision */}
            {(erreur.statut === 'ANNULE' || erreur.statut === 'CONFIRME') && (
              <div className={styles.timelineItem}>
                <div className={`${styles.timelineDot} ${erreur.statut === 'ANNULE' ? styles.success : styles.danger}`}>
                  {erreur.statut === 'ANNULE' ? '✓' : '✗'}
                </div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineDate}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    Décision du Centre d'Arbitrage
                  </div>
                  <strong style={{ color: erreur.statut === 'ANNULE' ? '#10b981' : '#ef4444' }}>
                    {erreur.statut === 'ANNULE' ? 'Contestation Acceptée (Pénalité annulée)' : 'Contestation Refusée (Pénalité maintenue)'}
                  </strong>
                  {erreur.reponseAdmin ? <p>"{erreur.reponseAdmin}"</p> : <p>Aucun commentaire de l'arbitre.</p>}
                </div>
              </div>
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