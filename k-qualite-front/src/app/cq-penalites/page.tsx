"use client";

import { useEffect, useState } from 'react';
import { getErreurs, getCqDataByPartenaire } from '@/services/apiService';
import { useAuth } from '@/context/AuthContext';
import InteractiveCard from '../admin/vue-globale/components/InteractiveCard/InteractiveCard'; 
import CustomSelect from '../admin/vue-globale/components/CustomSelect/CustomSelect'; 
import styles from './CqPenalites.module.css';

interface UnifiedPenalty {
  id: string;
  source: string;
  type: string;
  reference: string;
  description: string;
  impact: number;
  statut: string;
}

export default function CqPenalitesPage() {
  const { user } = useAuth();
  const [unifiedData, setUnifiedData] = useState<UnifiedPenalty[]>([]);
  const [loading, setLoading] = useState(true);

  // 🛡️ JDID: Filtres de période
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user?.partenaireId) {
      setLoading(true);
      
      const pId = user.partenaireId;
      
      Promise.all([
        getErreurs(pId, month, year),
        getCqDataByPartenaire(pId, "Audits tech", month, year),
        getCqDataByPartenaire(pId, "Check-voisinage", month, year),
        getCqDataByPartenaire(pId, "Expertises SAV", month, year),
        getCqDataByPartenaire(pId, "Taux de coupures", month, year)
      ]).then(([errs, cq1, cq2, cq3, cq4]) => {
        
        // 1. Mapping des Erreurs Classiques
        const mappedErrs: UnifiedPenalty[] = errs.map(e => {
          let st = 'NON_CONTESTE';
          if (e.statut === 'NOUVEAU' || e.statut === 'A_ANALYSER') st = 'NON_CONTESTE';
          else if (e.statut === 'CONTESTE') st = 'EN_ATTENTE';
          else if (e.statut === 'ANNULE') st = 'ACCEPTE';
          else if (e.statut === 'CONFIRME' || e.statut === 'CLOTURE') st = 'REFUSE';

          return {
            id: `err-${e.id}`,
            source: 'ERREUR',
            type: 'Erreur Classique',
            reference: e.dossierReference,
            description: e.regleDescription,
            impact: e.impactEstime,
            statut: st
          };
        });

        // 2. Mapping des CQ Data
        const mapCq = (data: any[], type: string): UnifiedPenalty[] => data.map(c => {
          let st = c.statutContestation || 'NON_CONTESTE';
          if (st === 'EN_COURS') st = 'EN_ATTENTE';

          return {
            id: `cq-${c.id}`,
            source: 'CQ_DATA',
            type: type,
            reference: c.reference || 'N/A',
            description: `Anomalie ${type}`,
            impact: c.mtSst || c.montant || 0,
            statut: st
          };
        });

        const allData = [
          ...mappedErrs, 
          ...mapCq(cq1, 'Audits tech'), 
          ...mapCq(cq2, 'Check-voisinage'), 
          ...mapCq(cq3, 'Expertises SAV'), 
          ...mapCq(cq4, 'Taux de coupures')
        ];

        // On ne garde que ce qui a un impact financier > 0
        const penalties = allData.filter(d => d.impact > 0);
        
        // Tri par impact décroissant
        penalties.sort((a, b) => b.impact - a.impact);
        
        setUnifiedData(penalties);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [user, month, year]);

  const totalPenalties = unifiedData.reduce((sum, item) => sum + item.impact, 0);

  const monthOptions = [1,2,3,4,5,6,7,8,9,10,11,12].map(m => ({ value: m, label: `Mois ${m}` }));
  const yearOptions = [2024, 2025, 2026, 2027].map(y => ({ value: y, label: y.toString() }));

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <div className={styles.partnerBadge}>PORTAIL QUALITÉ</div>
            <h1>Bilan Financier & Pénalités</h1>
            <p>Registre unifié de toutes vos pénalités (Erreurs et CQ) pour le mois sélectionné.</p>
          </div>
          
          <div className={styles.filtersWrapper}>
            <div className={styles.filterLabel}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Période
            </div>
            <CustomSelect value={month} options={monthOptions} onChange={setMonth} width="140px" />
            <CustomSelect value={year} options={yearOptions} onChange={setYear} width="110px" />
          </div>
        </header>

        <div className={styles.detailsSection}>
          <div className={styles.leftColumn}>
            <h2>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Registre Unifié des Pénalités
            </h2>
            <div className={styles.tableWrapper}>
              {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Calcul des impacts en cours...</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Dossier / Réf</th>
                      <th>Motif / Règle</th>
                      <th>Impact (€)</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unifiedData.map((item, index) => (
                      <tr key={item.id} className={styles.tableRow} style={{ animationDelay: `${index * 0.03}s` }}>
                        <td>
                          <span className={`${styles.typeBadge} ${item.source === 'ERREUR' ? styles.typeErreur : styles.typeCq}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className={styles.reference}>{item.reference}</td>
                        <td style={{ color: '#475569', fontWeight: '700' }}>{item.description}</td>
                        <td className={styles.amount}>{item.impact} €</td>
                        <td>
                          <span className={`${styles.statutBadge} ${
                            item.statut === 'NON_CONTESTE' ? styles.statutNonConteste :
                            item.statut === 'EN_ATTENTE' ? styles.statutEnAttente :
                            item.statut === 'ACCEPTE' ? styles.statutAccepte : styles.statutRefuse
                          }`}>
                            {item.statut.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {unifiedData.length === 0 && <tr><td colSpan={5} className={styles.empty}>Aucune pénalité détectée pour ce mois. Excellent travail!</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className={styles.rightColumn}>
            <InteractiveCard delayIndex={1}>
              <div className={styles.impactVault}>
                <div className={styles.vaultHeader}>
                  <h3 className={styles.vaultTitle}>Impact Total</h3>
                  <div className={styles.liveIndicator}>
                    <div className={styles.dot}></div> LIVE
                  </div>
                </div>

                <div className={styles.vaultMain}>
                  <div className={styles.radarRing1}></div>
                  <div className={styles.radarRing2}></div>
                  <h2 className={styles.vaultAmount}>{totalPenalties.toLocaleString('fr-FR')} €</h2>
                  <span className={styles.vaultSub}>Pour le mois {month}/{year}</span>
                </div>

                <div className={styles.projectionRow}>
                  <span>Pénalités Qualité</span>
                  <strong style={{ color: '#ef4444' }}>{totalPenalties.toLocaleString('fr-FR')} €</strong>
                </div>
                <div className={styles.projectionRow}>
                  <span>Plafonnement appliqué</span>
                  <strong style={{ color: '#10b981' }}>0 €</strong>
                </div>
                
                <button className={styles.detailsBtn} onClick={() => alert("Fonction d'export global en cours de développement.")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Télécharger le Bilan (Excel)
                </button>
              </div>
            </InteractiveCard>
          </div>
        </div>
      </div>
    </div>
  );
}