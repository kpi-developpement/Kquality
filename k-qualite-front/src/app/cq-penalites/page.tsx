import { getDashboardData, getErreurs } from '@/services/apiService';
import Card from '@/components/ui/Card/Card';
import styles from './CqPenalites.module.css';

export default async function CqPenalitesPage() {
  // Kan-fetchiw l'bilan w l'erreurs bjoj mn l'backend
  const data = await getDashboardData(1);
  const erreurs = await getErreurs(1);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Résultats CQ & Pénalités</h1>
        <p>Comprendre les écarts et la projection des pénalités du mois.</p>
      </header>

      <div className={styles.summaryGrid}>
        <Card 
          title="CQ Actuel" 
          value={`${data.cqPrevisionnel} %`} 
          subtitle="Résultat calculé à date" 
        />
        <Card 
          title="Objectif Contractuel" 
          value={`${data.objectifCq} %`} 
          subtitle="Seuil à atteindre" 
        />
        <Card 
          title="Écart" 
          value={`${data.ecartCq} pts`} 
          alert={data.ecartCq < 0}
        />
        <Card 
          title="Pénalités Estimées" 
          value={`${data.penalitesEstimees} €`} 
          subtitle={data.statutPenalites}
          alert={data.penalitesEstimees > 0}
        />
      </div>

      <div className={styles.detailsSection}>
        <div className={styles.leftColumn}>
          <h2>Détail des indicateurs (Moteur de règles)</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Indicateur / Règle</th>
                <th>Résultat</th>
                <th>Impact estimé</th>
              </tr>
            </thead>
            <tbody>
              {/* L'Tableau wlla dynamique kay-9ra mn l'erreurs dyal l'partenaire */}
              {erreurs.map((erreur) => (
                <tr key={erreur.id}>
                  <td><strong>{erreur.regleDescription}</strong> ({erreur.regleCode})</td>
                  <td>
                    {erreur.statut === 'ANNULE' ? (
                      <span className={styles.statusOk}>Annulé (Conforme)</span>
                    ) : (
                      <span className={styles.statusNok}>Non Conforme</span>
                    )}
                  </td>
                  <td className={styles.amount}>{erreur.impactEstime} €</td>
                </tr>
              ))}
              
              {/* Ligne par défaut ila kan kolchi mzyan wmakayn hta erreur */}
              {erreurs.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>
                    Aucune règle enfreinte ce mois-ci.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.rightColumn}>
          <h2>Projection Financière</h2>
          <div className={styles.projectionBox}>
            <div className={styles.projectionTag}>ESTIMATION</div>
            {/* L'Total hna ghay-tbdel automatiquement mnin l'Backend y-n9ess mn l'Penalite */}
            <div className={styles.projectionTotal}>{data.penalitesEstimees} €</div>
            <p className={styles.projectionSub}>si la période clôturait aujourd'hui</p>
            
            <hr className={styles.divider} />
            
            <div className={styles.projectionRow}>
              <span>Pénalités Qualité</span>
              <strong>{data.penalitesEstimees} €</strong>
            </div>
            <div className={styles.projectionRow}>
              <span>Plafonnement appliqué</span>
              <strong>0 €</strong>
            </div>
            
            <button className={styles.detailsBtn}>Télécharger le détail Excel</button>
          </div>
        </div>
      </div>
    </div>
  );
}