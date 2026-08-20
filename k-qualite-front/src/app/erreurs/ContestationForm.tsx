"use client";

import { useState } from 'react';
import { deposerContestation } from '@/services/apiService';
import styles from './ContestationForm.module.css';

interface ContestationFormProps { erreurId: number; onSuccess: () => void; }

export default function ContestationForm({ erreurId, onSuccess }: ContestationFormProps) {
  const [motif, setMotif] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [fileUrl, setFileUrl] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await deposerContestation(erreurId, motif, commentaire, fileUrl);
      alert('Contestation envoyée au centre de contrôle avec succès !');
      onSuccess(); 
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <h3 className={styles.title}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        Dépôt de Contestation Sécurisé
      </h3>
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      <div className={styles.inputGroup}>
        <label>Motif d'Écart *</label>
        <select required value={motif} onChange={(e) => setMotif(e.target.value)}>
          <option value="">Sélectionner un motif d'écart...</option>
          <option value="PREUVE_VALIDE">La preuve fournie est valide et conforme</option>
          <option value="HORS_PERIMETRE">L'intervention est hors périmètre contractuel</option>
          <option value="ERREUR_SYSTEME">Anomalie imputable au système d'information KYNTUS</option>
          <option value="AUTRE">Autre raison technique (à détailler)</option>
        </select>
      </div>
      
      <div className={styles.inputGroup}>
        <label>Rapport Technique (Argumentaire)</label>
        <textarea 
          rows={4} 
          placeholder="Détaillez les raisons techniques et opérationnelles prouvant la conformité de l'intervention..." 
          value={commentaire} 
          onChange={(e) => setCommentaire(e.target.value)}
        ></textarea>
      </div>
      
      <div className={styles.inputGroup}>
        <label>Pièce Jointe (URL de la Preuve)</label>
        {/* 🚀 CLASS fileInput FOR THE DASHED DROPZONE EFFECT */}
        <input 
          type="text" 
          className={styles.fileInput}
          placeholder="Collez ici l'URL de votre fichier (Ex: https://votre-serveur.com/preuve.jpg)" 
          value={fileUrl} 
          onChange={(e) => setFileUrl(e.target.value)} 
        />
        <small className={styles.helpText}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          Protocole de test : insérez le lien direct vers le fichier hébergé.
        </small>
      </div>
      
      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
            Cryptage et Envoi...
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            Transmettre le dossier à l'audit
          </>
        )}
      </button>
    </form>
  );
}