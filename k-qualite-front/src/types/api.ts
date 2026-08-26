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
  categorie?: string; 
  aContestation: boolean;
  partenaireNom?: string;
}

export interface ContestationResponseDTO {
  id: number;
  type: string; // 🛡️ JDID: "ERREUR" ou "PENALITE_CQ"
  motif: string;
  commentaire: string;
  pieceJointeUrl: string;
  dateDepot: string;
  erreurId: number;
  dossierReference: string;
  partenaireNom: string;
  impactEstime: number;
  statut: string; // 🛡️ JDID: "EN_ATTENTE", "ACCEPTE", "REFUSE"
  reponseAdmin?: string;
}

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
  createdAt: string;
}

export interface AuthResponseDTO {
  token: string;
  id: number;
  email: string;
  role: string;
  permissions: string[];
  partenaireId: number | null;
  mustChangePassword?: boolean;
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

export interface CqDataDTO {
  id: number;
  typeFeuille: string;
  kyn: string;
  mois: number;
  annee: number;
  anMois: string;
  reference: string;
  departement: string;
  montant: number;
  mtSst?: number;
  valeurMetrique: string;
  partenaireId?: number;
  partenaireNom?: string;
  statutContestation?: string;
  motifContestation?: string;
  dateContestation?: string;
  reponseAdmin?: string;
}

export interface CqPartenaireKpiDTO {
  id: number;
  partenaireId: number;
  partenaireNom: string;
  mois: number;
  annee: number;
  indicateur: string;
  zone: string;
  num: number;
  denum: number;
  resultat: number;
  bonus: number;
}
export interface ArticleDTO {
  id: number;
  titre: string;
  contenu: string;
  imageUrl?: string;
  dateCreation: string;
  vuesCount?: number;
}

export interface ArticleViewDTO {
  partenaireNom: string;
  dateVue: string;
}