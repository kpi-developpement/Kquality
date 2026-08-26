"use client";

import { useState, useRef } from 'react';
import { deposerContestation } from '@/services/apiService';
import styles from './ContestationForm.module.css';

interface ContestationFormProps { erreurId: number; onSuccess: () => void; }

export default function ContestationForm({ erreurId, onSuccess }: ContestationFormProps) {
  const [motif, setMotif] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🚀 DRAG & DROP STATES
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dropzoneInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      alert("Veuillez sélectionner une image valide (JPG, PNG).");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const resetDropzone = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      // 🛡️ L'FIX HWA HNA: On envoie l'objet File au lieu d'une string
      await deposerContestation(erreurId, motif, commentaire, file);
      alert('Contestation envoyée au centre de contrôle avec succès !');
      onSuccess(); 
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
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
        <label>Pièce Jointe (Optionnel)</label>
        
        {previewUrl ? (
          <div className={styles.previewContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className={styles.previewImage} />
            <button type="button" className={styles.removeBtn} onClick={resetDropzone} title="Supprimer l'image">✕</button>
          </div>
        ) : (
          <div 
            className={`${styles.dropzone} ${isDragging ? styles.active : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => dropzoneInputRef.current?.click()}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            <p>Glissez-déposez votre image ici</p>
            <span>ou cliquez pour parcourir vos fichiers</span>
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/jpg" 
              ref={dropzoneInputRef} 
              style={{ display: 'none' }} 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
          </div>
        )}
      </div>
      
      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={styles.spin}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
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