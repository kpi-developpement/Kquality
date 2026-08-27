"use client";

import { useEffect, useState } from 'react';
import { getDashboardData, getArticles, getServerUrl, getFullImageUrl } from '@/services/apiService'; 
import { DashboardPartenaireDTO, ArticleDTO } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link'; 
import InteractiveCard from '../admin/vue-globale/components/InteractiveCard/InteractiveCard'; 
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardPartenaireDTO | null>(null);
  const [articles, setArticles] = useState<ArticleDTO[]>([]); 
  const [loading, setLoading] = useState(true);

  const formatPenalty = (val: number) => val === 0 ? '0 €' : `-${Math.abs(val).toLocaleString('fr-FR')} €`;

  useEffect(() => {
    if (user?.partenaireId) {
      setLoading(true);
      
      getDashboardData(user.partenaireId)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));

      getArticles()
        .then(setArticles)
        .catch(console.error);
    }
  }, [user]);

  if (loading || !data) return <div className={styles.pageWrapper}><div style={{ textAlign: 'center', padding: '100px', fontWeight: 'bold', color: '#64748b' }}>Chargement sécurisé du Dashboard...</div></div>;

  const IconTarget = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;
  const IconAlert = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;

  // 🛡️ Helper pour afficher le bon thumbnail
  const renderMediaPreview = (article: ArticleDTO) => {
    if (!article.mediaUrl) {
      return <div className={styles.mediaPlaceholder}><span>K-NEWS</span></div>;
    }
    const type = article.mediaType || '';
    if (type.startsWith('image/')) {
      return <img src={getFullImageUrl(article.mediaUrl)} alt="Cover" className={styles.blogImg} />;
    }
    if (type.startsWith('video/')) {
      return (
        <div className={styles.mediaPlaceholder}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
          <span>Vidéo</span>
        </div>
      );
    }
    if (type.includes('pdf')) {
      return (
        <div className={styles.mediaPlaceholder}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span>Document PDF</span>
        </div>
      );
    }
    if (type.includes('spreadsheet') || type.includes('excel')) {
      return (
        <div className={styles.mediaPlaceholder}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          <span style={{color: '#10b981'}}>Fichier Excel</span>
        </div>
      );
    }
    return (
      <div className={styles.mediaPlaceholder}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
        <span>Fichier Joint</span>
      </div>
    );
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <div className={styles.partnerBadge}>PORTAIL QUALITÉ</div>
            <h1>Vue d'ensemble Opérationnelle</h1>
            <p>Performances et risques financiers pour la période en cours.</p>
          </div>
        </header>

        <div className={styles.grid}>
          <div style={{ gridColumn: 'span 2' }}>
            <InteractiveCard delayIndex={1}>
              <div className={styles.impactVault}>
                <div className={styles.vaultHeader}>
                  <h3 className={styles.vaultTitle}>Risque Financier (Pénalités Estimées)</h3>
                  <div className={styles.liveIndicator}><div className={styles.dot}></div> LIVE</div>
                </div>
                <div className={styles.vaultMain}>
                  <div className={styles.radarRing1}></div>
                  <div className={styles.radarRing2}></div>
                  <h2 className={styles.vaultAmount}>{formatPenalty(data.penalitesEstimees)}</h2>
                  <span className={styles.vaultSub}>Estimation à la clôture</span>
                </div>
              </div>
            </InteractiveCard>
          </div>

          <InteractiveCard delayIndex={2}>
            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiHeader}>
                  <div className={styles.kpiIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}>{IconTarget}</div>
                  <h3 className={styles.kpiTitle}>CQ Prévisionnel</h3>
                </div>
                <p className={styles.kpiValue} style={{ color: '#3b82f6', marginTop: '15px' }}>{data.cqPrevisionnel}%</p>
                <div className={styles.energyTrack}>
                  <div className={styles.energyFill} style={{ width: `${Math.min(data.cqPrevisionnel, 100)}%`, backgroundColor: '#3b82f6', boxShadow: `0 0 15px rgba(59,130,246,0.6)` }}>
                    <div className={styles.energySpark} style={{ color: '#3b82f6' }}></div>
                  </div>
                </div>
                <span className={styles.badgeInfo}>Objectif: {data.objectifCq}% (Écart: {data.ecartCq})</span>
              </div>
            </div>
          </InteractiveCard>

          <InteractiveCard delayIndex={3}>
            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiHeader}>
                  <div className={styles.kpiIcon} style={{ background: '#fef2f2', color: '#ef4444' }}>{IconAlert}</div>
                  <h3 className={styles.kpiTitle}>Erreurs Actives</h3>
                </div>
                <p className={styles.kpiValue} style={{ color: '#ef4444', marginTop: '15px' }}>{data.erreursActives}</p>
                {data.erreursUrgentes > 0 ? (
                  <span className={styles.badgeAlert}>⚠️ {data.erreursUrgentes} urgentes (sous 48h)</span>
                ) : (
                  <span className={styles.badgeInfo}>Aucune urgence</span>
                )}
              </div>
            </div>
          </InteractiveCard>
        </div>

        {articles.length > 0 && (
          <div className={styles.newsContainer}>
            <div className={styles.newsWatermark}>ARTICLES</div>
            
            <div className={styles.newsHeader}>
              <div className={styles.newsIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path><path d="M18 14h-8"></path><path d="M15 18h-5"></path></svg>
              </div>
              <h2>K-News & Mises à jour</h2>
            </div>
            <div className={styles.blogGrid}>
              {articles.map(a => (
                <Link href={`/dashboard/blog/${a.id}`} key={a.id} className={styles.blogCard}>
                  <div className={styles.blogImgWrapper}>
                    {renderMediaPreview(a)}
                  </div>
                  <div className={styles.blogBody}>
                    <span className={styles.blogDate}>{new Date(a.dateCreation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <h3 className={styles.blogTitle}>{a.titre}</h3>
                    <div className={styles.blogReadMore}>
                      Consulter
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}