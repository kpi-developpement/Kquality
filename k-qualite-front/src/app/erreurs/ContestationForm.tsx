/* erreurs/ContestationForm.tsx */
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
        <label>Motif de contestation *</label>
        <select required value={motif} onChange={(e) => setMotif(e.target.value)}>
          <option value="">Sélectionner un motif d'écart...</option>
          <option value="PREUVE_VALIDE">La preuve fournie est valide et conforme</option>
          <option value="HORS_PERIMETRE">L'intervention est hors périmètre contractuel</option>
          <option value="ERREUR_SYSTEME">Anomalie imputable au système d'information KYNTUS</option>
          <option value="AUTRE">Autre raison technique (à détailler)</option>
        </select>
      </div>
      <div className={styles.inputGroup}>
        <label>Rapport Technique (Explications)</label>
        <textarea rows={4} placeholder="Détaillez les raisons techniques et opérationnelles prouvant la conformité..." value={commentaire} onChange={(e) => setCommentaire(e.target.value)}></textarea>
      </div>
      <div className={styles.inputGroup}>
        <label>Pièce Jointe (URL de la Preuve)</label>
        <input type="text" placeholder="https://votre-serveur.com/preuve-intervention.jpg" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
        <small className={styles.helpText}>Protocole en cours : insérez le lien direct vers le fichier hébergé.</small>
      </div>
      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Cryptage et Envoi...' : 'Transmettre le dossier à l\'audit'}
      </button>
    </form>
  );
}