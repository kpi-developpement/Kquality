import { getErreurs } from '@/services/apiService';
import Link from 'next/link';
import styles from './Erreurs.module.css';

export default async function ErreursPage() {
  const erreurs = await getErreurs(1);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Liste des Erreurs</h1>
        <p>Identifiez et traitez les écarts avant la clôture.</p>
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Dossier</th>
              <th>Date</th>
              <th>Technicien</th>
              <th>Erreur</th>
              <th>Impact</th>
              <th>Échéance</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {erreurs.map((erreur) => (
              <tr key={erreur.id}>
                <td className={styles.reference}>{erreur.dossierReference}</td>
                <td>{new Date(erreur.dateDetection).toLocaleDateString()}</td>
                <td>{erreur.technicienNomComplet}</td>
                <td>{erreur.regleDescription}</td>
                <td className={styles.impact}>{erreur.impactEstime} €</td>
                <td>{new Date(erreur.echeanceContestation).toLocaleString()}</td>
                <td>
                  <span className={`${styles.badge} ${styles[erreur.statut.toLowerCase()]}`}>
                    {erreur.statut}
                  </span>
                </td>
                <td>
                  {/* Hna derna l'bouton bch y-dik l'détails */}
                  <Link href={`/erreurs/${erreur.id}`} className={styles.actionBtn}>
                    Consulter
                  </Link>
                </td>
              </tr>
            ))}
            {erreurs.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.empty}>Aucune erreur trouvée.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}