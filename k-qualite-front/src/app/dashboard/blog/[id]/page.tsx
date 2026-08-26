"use client";

import React, { useEffect, useState } from 'react';
import { getArticleById, recordArticleView } from '@/services/apiService';
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
        // 🚀 L'FIX HWA HNA: On enregistre la vue automatiquement (Tracking)
        await recordArticleView(Number(urlId));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAndRecord();
  }, [urlId]);

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', fontWeight: 'bold' }}>Chargement de l'article...</div>;
  if (!article) return <div style={{ textAlign: 'center', padding: '100px', fontWeight: 'bold' }}>Article introuvable.</div>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {article.imageUrl && (
          <img src={`http://localhost:8256${article.imageUrl}`} alt="Cover" className={styles.cover} />
        )}
        <div className={styles.contentBox}>
          <Link href="/dashboard" className={styles.backLink}>← Retour au Dashboard</Link>
          <span className={styles.date}>{new Date(article.dateCreation).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <h1 className={styles.title}>{article.titre}</h1>
          <div className={styles.body}>{article.contenu}</div>
        </div>
      </div>
    </div>
  );
}