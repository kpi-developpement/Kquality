"use client";

import React, { useEffect, useState } from 'react';
import { getArticleById, recordArticleView, getFullImageUrl } from '@/services/apiService';
import { ArticleDTO } from '@/types/api';
import Link from 'next/link';
import styles from './BlogDetail.module.css';

export default function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const urlId = resolvedParams.id;

  const [article, setArticle] = useState<ArticleDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndRecord = async () => {
      try {
        const data = await getArticleById(Number(urlId));
        setArticle(data);
        await recordArticleView(Number(urlId));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAndRecord();
  }, [urlId]);

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', fontWeight: 'bold' }}>Chargement de la publication...</div>;
  if (!article) return <div style={{ textAlign: 'center', padding: '100px', fontWeight: 'bold' }}>Publication introuvable.</div>;

  // Séparation des médias par type
  const images = article.medias?.filter(m => m.type.startsWith('image/')) || [];
  const videos = article.medias?.filter(m => m.type.startsWith('video/')) || [];
  const documents = article.medias?.filter(m => !m.type.startsWith('image/') && !m.type.startsWith('video/')) || [];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        
        <div className={styles.contentBox}>
          <Link href="/dashboard" className={styles.backLink}>← Retour au Dashboard</Link>
          <span className={styles.date}>{new Date(article.dateCreation).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <h1 className={styles.title}>{article.titre}</h1>
          <div className={styles.body}>{article.contenu}</div>

          {/* 🚀 GALERIE MULTIMEDIA */}
          <div className={styles.mediaGallery}>
            
            {/* 1. IMAGES (Design Mejnoun avec Blur Background) */}
            {images.map((img, idx) => {
              const url = getFullImageUrl(img.url);
              return (
                <div key={`img-${idx}`} className={styles.imageWrapper}>
                  <div className={styles.imageBlurBg} style={{ backgroundImage: `url(${url})` }}></div>
                  <img src={url} alt={`Media ${idx}`} className={styles.imageActual} />
                </div>
              );
            })}

            {/* 2. VIDEOS */}
            {videos.map((vid, idx) => (
              <div key={`vid-${idx}`} className={styles.videoWrapper}>
                <video controls className={styles.videoPlayer}>
                  <source src={getFullImageUrl(vid.url)} type={vid.type} />
                  Votre navigateur ne supporte pas la lecture de vidéos.
                </video>
              </div>
            ))}

            {/* 3. DOCUMENTS (PDF, Excel, etc.) */}
            {documents.length > 0 && (
              <div className={styles.documentsGrid}>
                {documents.map((doc, idx) => {
                  const isPdf = doc.type.includes('pdf');
                  const isExcel = doc.type.includes('spreadsheet') || doc.type.includes('excel');
                  
                  return (
                    <div key={`doc-${idx}`} className={styles.downloadBox}>
                      <div className={styles.downloadInfo}>
                        <div className={styles.downloadIcon} style={{ color: isExcel ? '#10b981' : '#3b82f6', background: isExcel ? '#ecfdf5' : '#eff6ff' }}>
                          {isExcel ? (
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                          )}
                        </div>
                        <div className={styles.downloadText}>
                          <h4>Pièce jointe {idx + 1}</h4>
                          <p>{isPdf ? 'Document PDF' : isExcel ? 'Fichier Excel' : 'Fichier'}</p>
                        </div>
                      </div>
                      <a href={getFullImageUrl(doc.url)} download target="_blank" rel="noopener noreferrer" className={styles.btnDownload}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Télécharger
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}