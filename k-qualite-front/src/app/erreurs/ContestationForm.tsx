"use client";

import { useState } from 'react';
import { deposerContestation } from '@/services/apiService';
import styles from './ContestationForm.module.css';

interface ContestationFormProps {
  erreurId: number;
  onSuccess: () => void;
}

export default function ContestationForm({ erreurId, onSuccess }: ContestationFormProps) {
  const [motif, setMotif] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [fileUrl, setFileUrl] = useState(''); // F l'wa9i3 hada ghaykon upload l S3 w y-rejje3 lik URL
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Kansiftou l'data l'Spring Boot
      await deposerContestation(erreurId, motif, commentaire, fileUrl);
      alert('Contestation envoyée avec succès !');
      onSuccess(); // N-refreshiw l'page
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Déposer une contestation</h3>
      
      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.inputGroup}>
        <label>Motif de contestation *</label>
        <select required value={motif} onChange={(e) => setMotif(e.target.value)}>
          <option value="">Sélectionner un motif...</option>
          <option value="PREUVE_VALIDE">La preuve fournie est valide</option>
          <option value="HORS_PERIMETRE">Intervention hors périmètre</option>
          <option value="ERREUR_SYSTEME">Erreur système KYNTUS</option>
          <option value="AUTRE">Autre raison</option>
        </select>
      </div>

      <div className={styles.inputGroup}>
        <label>Explications détaillées</label>
        <textarea 
          rows={4} 
          placeholder="Expliquez pourquoi cette erreur n'est pas justifiée..."
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
        ></textarea>
      </div>

      <div className={styles.inputGroup}>
        <label>Pièce jointe (Fichier / Preuve)</label>
        <input 
          type="text" 
          placeholder="Lien vers votre image ou fichier PDF (Ex: https://...)" 
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
        />
        <small className={styles.helpText}>Pour l'instant, collez une URL d'image valide.</small>
      </div>

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Envoi en cours...' : 'Soumettre la contestation'}
      </button>
    </form>
  );
}