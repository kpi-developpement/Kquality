"use client";

import { useEffect, useState } from 'react';
import { getAdminUsers, getAdminPartenaires, createAdminUser, updateAdminUser, deleteAdminUser } from '@/services/apiService';
import { UtilisateurDTO, PartenaireDTO } from '@/types/api';
import styles from './Utilisateurs.module.css';

const AVAILABLE_PERMISSIONS = [
  "READ_GLOBAL_KPI", "MANAGE_USERS", "MANAGE_ROLES", 
  "READ_DASHBOARD", "READ_ERREURS", "CREATE_CONTESTATION", 
  "READ_CONTESTATIONS", "TRAITER_CONTESTATION"
];

export default function UtilisateursPage() {
  const [users, setUsers] = useState<UtilisateurDTO[]>([]);
  const [partenaires, setPartenaires] = useState<PartenaireDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UtilisateurDTO>({
    email: '', motDePasse: '', role: 'AGENT_KYNTUS', actif: true, partenaireId: null, permissions: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uData, pData] = await Promise.all([getAdminUsers(), getAdminPartenaires()]);
      setUsers(uData);
      setPartenaires(pData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (user?: UtilisateurDTO) => {
    if (user) {
      setEditingId(user.id!);
      setFormData({ ...user, motDePasse: '' }); // Password khawi f l'edit
    } else {
      setEditingId(null);
      setFormData({ email: '', motDePasse: '', role: 'AGENT_KYNTUS', actif: true, partenaireId: null, permissions: [] });
    }
    setIsModalOpen(true);
  };

  const handlePermissionToggle = (perm: string) => {
    setFormData(prev => {
      const perms = prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm];
      return { ...prev, permissions: perms };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAdminUser(editingId, formData);
        alert("Utilisateur mis à jour !");
      } else {
        if (!formData.motDePasse) return alert("Mot de passe obligatoire pour la création");
        await createAdminUser(formData);
        alert("Utilisateur créé !");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
      try {
        await deleteAdminUser(id);
        fetchData();
      } catch (err) { alert("Erreur lors de la suppression"); }
    }
  };

  if (loading) return <div className={styles.container}>Chargement...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <div className={styles.adminBadge}>IAM - SÉCURITÉ</div>
          <h1>Gestion des Utilisateurs & Accès</h1>
          <p>Créez des profils et assignez des rôles et permissions dynamiques.</p>
        </div>
        <button className={styles.btnAdd} onClick={() => openModal()}>+ Nouvel Utilisateur</button>
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th><th>Rôle</th><th>Partenaire</th><th>Statut</th><th>Permissions</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 'bold' }}>{u.email}</td>
                <td><span className={`${styles.roleBadge} ${styles['role' + u.role]}`}>{u.role}</span></td>
                <td>{u.partenaireNom || '-'}</td>
                <td>{u.actif ? <span style={{color:'green'}}>Actif</span> : <span style={{color:'red'}}>Inactif</span>}</td>
                <td style={{ maxWidth: '300px' }}>
                  {u.permissions.map(p => <span key={p} className={styles.permBadge}>{p}</span>)}
                </td>
                <td>
                  <button className={styles.btnEdit} onClick={() => openModal(u)}>Éditer</button>
                  <button className={styles.btnDelete} onClick={() => handleDelete(u.id!)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>{editingId ? "Modifier l'utilisateur" : "Créer un utilisateur"}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              
              <div className={styles.formGroup}>
                <label>Mot de passe {editingId && "(Laisser vide pour ne pas modifier)"}</label>
                <input type="password" required={!editingId} value={formData.motDePasse} onChange={e => setFormData({...formData, motDePasse: e.target.value})} />
              </div>

              <div className={styles.formGroup}>
                <label>Rôle Système</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="ADMIN">ADMIN (Accès Total)</option>
                  <option value="PILOTE">PILOTE (Validation)</option>
                  <option value="PARTENAIRE">PARTENAIRE (Client)</option>
                  <option value="AGENT_KYNTUS">AGENT KYNTUS (Consultation)</option>
                </select>
              </div>

              {formData.role === 'PARTENAIRE' && (
                <div className={styles.formGroup}>
                  <label>Lier à une Entreprise Partenaire</label>
                  <select required value={formData.partenaireId || ''} onChange={e => setFormData({...formData, partenaireId: Number(e.target.value)})}>
                    <option value="">-- Sélectionner --</option>
                    {partenaires.map(p => <option key={p.id} value={p.id}>{p.nomEntreprise}</option>)}
                  </select>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Statut du compte</label>
                <select value={formData.actif ? "true" : "false"} onChange={e => setFormData({...formData, actif: e.target.value === "true"})}>
                  <option value="true">Actif</option>
                  <option value="false">Désactivé</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Permissions (Accès granulaires)</label>
                <div className={styles.permissionsGrid}>
                  {AVAILABLE_PERMISSIONS.map(perm => (
                    <label key={perm} className={styles.checkboxLabel}>
                      <input type="checkbox" checked={formData.permissions.includes(perm)} onChange={() => handlePermissionToggle(perm)} />
                      {perm}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setIsModalOpen(false)}>Annuler</button>
                <button type="submit" className={styles.btnSave}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}