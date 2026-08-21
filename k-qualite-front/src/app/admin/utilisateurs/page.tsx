"use client";

import { useEffect, useState, useMemo } from 'react';
// 🛡️ L'FIX HWA HNA: Remplacer updateAdminUser par updateUser
import { getAdminUsers, getAdminPartenaires, createAdminUser, updateUser, deleteAdminUser } from '@/services/apiService';
import { UtilisateurDTO, PartenaireDTO } from '@/types/api';
import styles from './Utilisateurs.module.css';

const AVAILABLE_PERMISSIONS = [
  "READ_GLOBAL_KPI", "MANAGE_USERS", "MANAGE_ROLES", 
  "READ_DASHBOARD", "READ_ERREURS", "CREATE_CONTESTATION", 
  "READ_CONTESTATIONS", "TRAITER_CONTESTATION"
];

const ITEMS_PER_PAGE = 8; // 🚀 Nombre d'utilisateurs par page

export default function UtilisateursPage() {
  const [users, setUsers] = useState<UtilisateurDTO[]>([]);
  const [partenaires, setPartenaires] = useState<PartenaireDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

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
      setFormData({ ...user, motDePasse: '' });
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
        // 🛡️ L'FIX HWA HNA: Utilisation de updateUser
        await updateUser(editingId, formData);
        alert("Utilisateur mis à jour avec succès !");
      } else {
        if (!formData.motDePasse) return alert("Mot de passe obligatoire pour la création");
        await createAdminUser(formData);
        alert("Utilisateur créé avec succès !");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Action irréversible : Voulez-vous vraiment révoquer cet utilisateur ?")) {
      try {
        await deleteAdminUser(id);
        fetchData();
      } catch (err) { alert("Erreur lors de la révocation."); }
    }
  };

  // 🚀 LOGIQUE PAGINATION
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return users.slice(start, start + ITEMS_PER_PAGE);
  }, [users, currentPage]);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <div className={styles.adminBadge}>IAM - SÉCURITÉ</div>
            <h1>Contrôle des Accès</h1>
            <p>Créez des profils et assignez des rôles et permissions dynamiques.</p>
          </div>
          <button className={styles.btnAdd} onClick={() => openModal()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nouvel Utilisateur
          </button>
        </header>

        <div className={styles.tableWrapper}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Chargement des accès en cours...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email / Identifiant</th>
                  <th>Rôle Système</th>
                  <th>Affiliation Partenaire</th>
                  <th>Statut</th>
                  <th>Permissions Habilitées</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u, index) => (
                  <tr key={`${u.id}-${currentPage}`} className={styles.tableRow} style={{ animationDelay: `${index * 0.05}s` }}>
                    <td style={{ fontWeight: '900', color: '#0f172a' }}>{u.email}</td>
                    <td><span className={`${styles.roleBadge} ${styles['role' + u.role]}`}>{u.role.replace('_', ' ')}</span></td>
                    <td style={{ fontWeight: '700', color: '#475569' }}>{u.partenaireNom || 'Non Affilié (Interne)'}</td>
                    <td>
                      {u.actif 
                        ? <span style={{color:'#10b981', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px'}}><span style={{width:'8px',height:'8px',background:'#10b981',borderRadius:'50%',boxShadow:'0 0 8px #10b981'}}></span> Actif</span> 
                        : <span style={{color:'#ef4444', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px'}}><span style={{width:'8px',height:'8px',background:'#ef4444',borderRadius:'50%'}}></span> Désactivé</span>
                      }
                    </td>
                    <td style={{ maxWidth: '350px' }}>
                      <div className={styles.permissionsContainer}>
                        {u.permissions.map(p => <span key={p} className={styles.permBadge}>{p.replace('_', ' ')}</span>)}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionsBox}>
                        <button className={styles.btnEdit} onClick={() => openModal(u)}>Éditer</button>
                        <button className={styles.btnDelete} onClick={() => handleDelete(u.id!)}>Révocation</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontStyle: 'italic', fontWeight: '800' }}>Aucun utilisateur configuré.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 🚀 PAGINATION BAR LUXE */}
        {!loading && totalPages > 1 && (
          <div className={styles.paginationWrapper}>
            <span className={styles.pageInfo}>
              Affichage {((currentPage - 1) * ITEMS_PER_PAGE) + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, users.length)} sur {users.length}
            </span>
            <div className={styles.pageControls}>
              <button 
                className={styles.pageBtn} 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                &lt;
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <button 
                      key={page}
                      className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                }
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} style={{ color: '#94a3b8', padding: '0 5px' }}>...</span>;
                }
                return null;
              })}

              <button 
                className={styles.pageBtn} 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                &gt;
              </button>
            </div>
          </div>
        )}

        {/* MODAL SECURE GATEWAY */}
        {isModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>{editingId ? "Modification des Accès" : "Provisionnement d'Accès"}</h2>
              </div>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label>Email Professionnel</label>
                  <input type="email" required placeholder="nom@entreprise.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Clé de Sécurité {editingId && <span style={{textTransform:'none', fontWeight:'600', color:'#94a3b8'}}>(Laisser vide pour conserver l'actuelle)</span>}</label>
                  <input type="password" placeholder="••••••••" required={!editingId} value={formData.motDePasse} onChange={e => setFormData({...formData, motDePasse: e.target.value})} />
                </div>

                <div className={styles.formGroup}>
                  <label>Rôle Global</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="ADMIN">ADMIN (Contrôle Total)</option>
                    <option value="PILOTE">PILOTE (Validation Qualité)</option>
                    <option value="PARTENAIRE">PARTENAIRE (Client Externe)</option>
                    <option value="AGENT_KYNTUS">AGENT KYNTUS (Consultation)</option>
                  </select>
                </div>

                {formData.role === 'PARTENAIRE' && (
                  <div className={styles.formGroup}>
                    <label>Affiliation Entreprise Partenaire</label>
                    <select required value={formData.partenaireId || ''} onChange={e => setFormData({...formData, partenaireId: Number(e.target.value)})}>
                      <option value="">-- Assigner à une entité --</option>
                      {partenaires.map(p => <option key={p.id} value={p.id}>{p.nomEntreprise}</option>)}
                    </select>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label>État du Compte</label>
                  <select value={formData.actif ? "true" : "false"} onChange={e => setFormData({...formData, actif: e.target.value === "true"})}>
                    <option value="true">Actif (Accès Autorisé)</option>
                    <option value="false">Désactivé (Accès Bloqué)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Matrice des Permissions</label>
                  <div className={styles.permissionsGrid}>
                    {AVAILABLE_PERMISSIONS.map(perm => (
                      <label key={perm} className={styles.checkboxLabel}>
                        <input type="checkbox" checked={formData.permissions.includes(perm)} onChange={() => handlePermissionToggle(perm)} />
                        {perm.replace(/_/g, ' ')}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnCancel} onClick={() => setIsModalOpen(false)}>Annuler l'opération</button>
                  <button type="submit" className={styles.btnSave}>{editingId ? "Sauvegarder" : "Déployer l'Accès"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}