"use client";

import { useEffect, useState } from 'react';
import { getCqDataByPartenaire } from '@/services/apiService';
import { CqDataDTO } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import styles from './CqDetails.module.css';

const TABS = ["Audits tech", "Check-voisinage", "Expertises SAV", "Taux de coupures"];

export default function CqDetailsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [data, setData] = useState<CqDataDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.partenaireId) {
      setLoading(true);
      getCqDataByPartenaire(user.partenaireId, activeTab)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, activeTab]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Détails CQ (Fichiers Excel)</h1>
        <p>Consultez les lignes qui vous ont été attribuées depuis les fichiers d'analyse.</p>
      </header>

      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button 
            key={tab} 
            className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>Chargement des données...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                {activeTab === "Audits tech" && <><th>Mois</th><th>ID RDV</th><th>Département</th><th>Montant</th><th>KYN</th></>}
                {activeTab === "Check-voisinage" && <><th>Mois</th><th>Intervention</th><th>Voisins KO</th><th>Montant</th><th>KYN</th></>}
                {activeTab === "Expertises SAV" && <><th>N° Intervention</th><th>KYN</th></>}
                {activeTab === "Taux de coupures" && <><th>ID RDV</th><th>Clients Coupés</th><th>Département</th><th>Montant</th><th>KYN</th></>}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  {activeTab === "Audits tech" && <><td>{row.anMois}</td><td>{row.reference}</td><td>{row.departement}</td><td>{row.montant} €</td><td>{row.kyn}</td></>}
                  {activeTab === "Check-voisinage" && <><td>{row.anMois}</td><td>{row.reference}</td><td>{row.valeurMetrique}</td><td>{row.montant} €</td><td>{row.kyn}</td></>}
                  {activeTab === "Expertises SAV" && <><td>{row.reference}</td><td>{row.kyn}</td></>}
                  {activeTab === "Taux de coupures" && <><td>{row.reference}</td><td>{row.valeurMetrique}</td><td>{row.departement}</td><td>{row.montant} €</td><td>{row.kyn}</td></>}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.empty}>Aucune donnée trouvée pour "{activeTab}".</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}