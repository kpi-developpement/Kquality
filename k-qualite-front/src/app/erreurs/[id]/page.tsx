import { getErreurs } from '@/services/apiService';
import ContestationForm from '../ContestationForm'; 
import Link from 'next/link';
import styles from './ErreurDetail.module.css';
import { revalidatePath } from 'next/cache';

// F Next 15+, params kadiroha Promise
export default async function ErreurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  
  // 1. N-tsennaw l'ID hta y-tcharja mn l'URL
  const resolvedParams = await params;
  const urlId = resolvedParams.id;

  // 2. N-jbdou ga3 l'erreurs w n-filtriw b l'ID li jbna
  const erreurs = await getErreurs(1);
  const erreur = erreurs.find(e => e.id.toString() === urlId);

  if (!erreur) {
    return (
      <div className={styles.container}>
        <Link href="/erreurs" className={styles.backLink}>&larr; Retour à la liste</Link>
        <h1>Erreur introuvable (ID: {urlId})</h1>
      </div>
    );
  }

  // 3. Fonction dyal refraîchissement
  const handleSuccess = async () => {
    "use server";
    revalidatePath(`/erreurs/${urlId}`);
    revalidatePath(`/erreurs`);
  };

  return (
    <div className={styles.container}>
      <Link href="/erreurs" className={styles.backLink}>&larr; Retour à la liste</Link>
      
      <div className={styles.headerBox}>
        <div className={styles.headerLeft}>
          <h1>Dossier : {erreur.dossierReference}</h1>
          <p className={styles.regle}>{erreur.regleDescription}</p>
        </div>
        <div className={styles.headerRight}>
          <span className={`${styles.badge} ${styles[erreur.statut.toLowerCase()]}`}>{erreur.statut}</span>
          <h2 className={styles.impact}>{erreur.impactEstime} €</h2>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.infoCard}>
          <h3>Détails de l'intervention</h3>
          <ul>
            <li><strong>Technicien:</strong> {erreur.technicienNomComplet} ({erreur.technicienMatricule})</li>
            <li><strong>Date d'intervention:</strong> {new Date(erreur.dossierDateIntervention).toLocaleDateString()}</li>
            <li><strong>Date de détection:</strong> {new Date(erreur.dateDetection).toLocaleString()}</li>
            <li><strong>Échéance contestation:</strong> {new Date(erreur.echeanceContestation).toLocaleString()}</li>
          </ul>
        </div>
        
        <div className={styles.infoCard}>
          <h3>Preuve de l'erreur</h3>
          {erreur.preuveUrl ? (
             // eslint-disable-next-line @next/next/no-img-element
            <img src={erreur.preuveUrl} alt="Preuve de l'erreur" className={styles.preuveImg} />
          ) : (
            <div className={styles.noPreuve}>Aucune preuve photo disponible.</div>
          )}
        </div>
      </div>

      {/* Formulaire de contestation */}
      {erreur.statut === 'NOUVEAU' || erreur.statut === 'A_ANALYSER' ? (
        <ContestationForm erreurId={erreur.id} onSuccess={handleSuccess} />
      ) : (
        <div className={styles.lockedMessage}>
          Cette erreur est verrouillée (Statut: {erreur.statut}). Vous ne pouvez plus la contester.
        </div>
      )}
    </div>
  );
}