export interface ApiResponse<T> {
  timestamp: string;
  status: number;
  message: string;
  data: T;
}

export interface DashboardPartenaireDTO {
  cqPrevisionnel: number;
  objectifCq: number;
  ecartCq: number;
  totalDossiersControles: number;
  erreursActives: number;
  erreursUrgentes: number;
  penalitesEstimees: number;
  statutPenalites: string;
}

export interface ErreurResponseDTO {
  id: number;
  dateDetection: string;
  preuveUrl: string | null;
  impactEstime: number;
  echeanceContestation: string;
  statut: string;
  dossierReference: string;
  dossierDateIntervention: string;
  technicienNomComplet: string;
  technicienMatricule: string;
  regleCode: string;
  regleDescription: string;
  aContestation: boolean;
}
export interface ContestationResponseDTO {
  id: number;
  motif: string;
  commentaire: string;
  pieceJointeUrl: string;
  dateDepot: string;
  erreurId: number;
  dossierReference: string;
  partenaireNom: string;
  impactEstime: number;
}

// --- JDID ---
export interface KpiArchiveDTO {
  id: number;
  mois: number;
  annee: number;
  processus: string;
  departement: string;
  num: number;
  denum: number;
  resultat: number;
  partDeMarche: number;
  bonus: number;
}

export interface AuthResponseDTO {
  token: string;
  id: number;
  email: string;
  role: string;
  permissions: string[];
  partenaireId: number | null;
}
export interface PartenaireDTO {
  id: number;
  nomEntreprise: string;
}

export interface UtilisateurDTO {
  id?: number;
  email: string;
  motDePasse?: string;
  role: string;
  actif: boolean;
  partenaireId?: number | null;
  partenaireNom?: string;
  permissions: string[];
}
export interface AuthResponseDTO {
  token: string;
  id: number;
  email: string;
  role: string;
  permissions: string[];
  partenaireId: number | null;
  mustChangePassword?: boolean; // 🛡️ L'FIX HWA HNA
}
export interface CqDataDTO {
  id: number;
  typeFeuille: string;
  kyn: string;
  anMois: string;
  reference: string;
  departement: string;
  montant: number;
  valeurMetrique: string;
}