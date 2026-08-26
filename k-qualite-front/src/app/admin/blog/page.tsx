"use client";

import { useEffect, useState, useRef } from 'react';
import { getArticles, createArticle, getArticleViews } from '@/services/apiService';
import { ArticleDTO, ArticleViewDTO } from '@/types/api';
import styles from './Blog.module.css';

export default function AdminBlogPage() {
  const [articles, setArticles] = useState<ArticleDTO[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewsModalOpen, setIsViewsModalOpen] = useState(false);
  const [views, setViews] = useState<ArticleViewDTO[]>([]);
  
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchArticles = () => getArticles().then(setArticles).catch(console.error);
  useEffect(() => { fetchArticles(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createArticle(titre, contenu, file);
      setIsCreateModalOpen(false);
      setTitre(""); setContenu(""); setFile(null);
      fetchArticles();
    } catch (err) { alert("Erreur"); }
    setLoading(false);
  };

  const openViews = async (id: number) => {
    const data = await getArticleViews(id);
    setViews(data);
    setIsViewsModalOpen(true);
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <div className={styles.adminBadge}>COMMUNICATION</div>
            <h1>Actualités & Blog</h1>
            <p>Publiez des mises à jour et suivez les lectures des partenaires.</p>
          </div>
          <button className={styles.btnAdd} onClick={() => setIsCreateModalOpen(true)}>+ Nouvel Article</button>
        </header>

        <div className={styles.grid}>
          {articles.map(a => (
            <div key={a.id} className={styles.card}>
              {a.imageUrl ? (
                <img src={`http://localhost:8256${a.imageUrl}`} alt="Cover" className={styles.cardImg} />
              ) : (
                <div className={styles.cardImg} style={{display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontWeight:'bold'}}>Sans Image</div>
              )}
              <div className={styles.cardBody}>
                <div className={styles.cardDate}>{new Date(a.dateCreation).toLocaleDateString()}</div>
                <h3 className={styles.cardTitle}>{a.titre}</h3>
                <div className={styles.cardStats}>
                  <div className={styles.views}>👁️ {a.vuesCount} Vues</div>
                  <button className={styles.btnStats} onClick={() => openViews(a.id)}>Détails Vues</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isCreateModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2>Rédiger un Article</h2>
              <form onSubmit={handleCreate}>
                <div className={styles.formGroup}>
                  <label>Titre</label>
                  <input required value={titre} onChange={e => setTitre(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Contenu</label>
                  <textarea required rows={6} value={contenu} onChange={e => setContenu(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Image de couverture</label>
                  <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.btnCancel} onClick={() => setIsCreateModalOpen(false)}>Annuler</button>
                  <button type="submit" className={styles.btnSave} disabled={loading}>{loading ? 'Publication...' : 'Publier'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isViewsModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2>Statistiques de Lecture</h2>
              <ul className={styles.viewList}>
                {views.map((v, i) => (
                  <li key={i} className={styles.viewItem}>
                    <strong>{v.partenaireNom}</strong>
                    <span>{new Date(v.dateVue).toLocaleString()}</span>
                  </li>
                ))}
                {views.length === 0 && <p style={{textAlign:'center', color:'#94a3b8'}}>Aucune vue pour le moment.</p>}
              </ul>
              <div className={styles.modalActions}>
                <button className={styles.btnCancel} onClick={() => setIsViewsModalOpen(false)}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}