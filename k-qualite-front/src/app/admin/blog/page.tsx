"use client";

import { useEffect, useState } from 'react';
import { getArticles, createArticle, getArticleViews, deleteArticle, getFullImageUrl } from '@/services/apiService';
import { ArticleDTO, ArticleViewDTO } from '@/types/api';
import styles from './Blog.module.css';

export default function AdminBlogPage() {
  const [articles, setArticles] = useState<ArticleDTO[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewsModalOpen, setIsViewsModalOpen] = useState(false);
  const [views, setViews] = useState<ArticleViewDTO[]>([]);
  
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [files, setFiles] = useState<File[]>([]); // 🛡️ JDID: Tableau de fichiers
  const [loading, setLoading] = useState(false);

  const fetchArticles = () => getArticles().then(setArticles).catch(console.error);
  useEffect(() => { fetchArticles(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createArticle(titre, contenu, files);
      setIsCreateModalOpen(false);
      setTitre(""); setContenu(""); setFiles([]);
      fetchArticles();
    } catch (err) { alert("Erreur lors de la publication"); }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer cet article et tous ses médias ?")) {
      try {
        await deleteArticle(id);
        fetchArticles();
      } catch (err) { alert("Erreur lors de la suppression"); }
    }
  };

  const openViews = async (id: number) => {
    const data = await getArticleViews(id);
    setViews(data);
    setIsViewsModalOpen(true);
  };

  // 🛡️ Helper pour la carte (affiche le premier média comme cover)
  const renderMediaPreview = (article: ArticleDTO) => {
    if (!article.medias || article.medias.length === 0) {
      return <div className={styles.mediaPlaceholder}><span>Sans Pièce Jointe</span></div>;
    }
    
    const firstMedia = article.medias[0];
    const type = firstMedia.type || '';
    const url = getFullImageUrl(firstMedia.url);
    const extraCount = article.medias.length - 1;

    if (type.startsWith('image/')) {
      return (
        <div className={styles.mediaWrapper}>
          <div className={styles.mediaBlurBg} style={{ backgroundImage: `url(${url})` }}></div>
          <img src={url} alt="Cover" className={styles.mediaContent} />
          {extraCount > 0 && <div className={styles.mediaCountBadge}>+{extraCount} média{extraCount > 1 ? 's' : ''}</div>}
        </div>
      );
    }
    if (type.startsWith('video/')) {
      return (
        <div className={styles.mediaWrapper}>
          <video src={url} className={styles.mediaContent} muted />
          <div className={styles.mediaCountBadge}>Vidéo {extraCount > 0 ? `+${extraCount}` : ''}</div>
        </div>
      );
    }
    
    return (
      <div className={styles.mediaPlaceholder}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        <span>{article.medias.length} Fichier(s) Joint(s)</span>
      </div>
    );
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <div className={styles.adminBadge}>COMMUNICATION</div>
            <h1>Actualités & Blog</h1>
            <p>Publiez des mises à jour avec plusieurs images, vidéos ou documents.</p>
          </div>
          <button className={styles.btnAdd} onClick={() => setIsCreateModalOpen(true)}>+ Nouvelle Publication</button>
        </header>

        <div className={styles.grid}>
          {articles.map(a => (
            <div key={a.id} className={styles.card}>
              <button className={styles.btnDelete} onClick={() => handleDelete(a.id)} title="Supprimer">✕</button>
              
              {renderMediaPreview(a)}

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
              <h2>Rédiger une Publication</h2>
              <form onSubmit={handleCreate}>
                <div className={styles.formGroup}>
                  <label>Titre de la publication</label>
                  <input required value={titre} onChange={e => setTitre(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Contenu / Description</label>
                  <textarea required rows={6} value={contenu} onChange={e => setContenu(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Pièces Jointes (Sélectionnez plusieurs fichiers)</label>
                  <input type="file" multiple accept="*/*" onChange={handleFileChange} />
                  
                  {files.length > 0 && (
                    <div className={styles.filesPreview}>
                      {files.map((f, i) => (
                        <div key={i} className={styles.fileBadge}>
                          {f.name} <button type="button" onClick={() => removeFile(i)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
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