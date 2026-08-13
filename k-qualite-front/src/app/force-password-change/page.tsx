"use client";

import { useState } from 'react';
import { changePassword } from '@/services/apiService';
import { useAuth } from '@/context/AuthContext';
import styles from './ForcePassword.module.css';

export default function ForcePasswordChangePage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { completePasswordChange } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);

    try {
      await changePassword(oldPassword, newPassword);
      // Ila daz kolchi mzyan, l'Context ghay-sauvegarder w y-rediriger
      completePasswordChange();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>Sécurisation du compte</h1>
        <p className={styles.subtitle}>
          Pour des raisons de sécurité, vous devez modifier votre mot de passe par défaut avant d'accéder à votre espace K-Qualité.
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Mot de passe actuel (par défaut)</label>
            <input 
              type="password" 
              required 
              value={oldPassword} 
              onChange={(e) => setOldPassword(e.target.value)} 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Nouveau mot de passe</label>
            <input 
              type="password" 
              required 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Confirmer le nouveau mot de passe</label>
            <input 
              type="password" 
              required 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Mise à jour...' : 'Valider et continuer'}
          </button>
        </form>
      </div>
    </div>
  );
}