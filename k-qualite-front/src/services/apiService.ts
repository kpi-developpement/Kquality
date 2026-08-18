import { ApiResponse, DashboardPartenaireDTO, ErreurResponseDTO, ContestationResponseDTO, KpiArchiveDTO, AuthResponseDTO } from '../types/api';
import { PartenaireDTO, UtilisateurDTO } from '../types/api';
import { CqDataDTO } from '../types/api';
import { CqPartenaireKpiDTO } from '../types/api';

const isServer = typeof window === 'undefined';
const BASE_URL = isServer 
  ? 'http://kq_backend:8256/api/v1' 
  : (process.env.NEXT_PUBLIC_API_URL || 'http://10.10.10.25:8256/api/v1');

// 🛡️ L'FIX HWA HNA: Fonction bach n-jbdou l'Token mn LocalStorage
const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (!isServer) {
    const token = localStorage.getItem('kyntus_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

// --- AUTHENTICATION ---
export async function login(email: string, password: string): Promise<AuthResponseDTO> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Identifiants incorrects`);
  }
  
  const json: ApiResponse<AuthResponseDTO> = await res.json();
  return json.data;
}

// --- DATA FETCHING (M-sécurisé b l'Token) ---
export async function getDashboardData(partenaireId: number = 1): Promise<DashboardPartenaireDTO> {
  const url = `${BASE_URL}/dashboard/partenaire/${partenaireId}?periodeMois=2026-08`;
  const res = await fetch(url, { headers: getAuthHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur Backend HTTP ${res.status}`);
  const json: ApiResponse<DashboardPartenaireDTO> = await res.json();
  return json.data;
}

export async function getErreurs(partenaireId: number = 1): Promise<ErreurResponseDTO[]> {
  const res = await fetch(`${BASE_URL}/erreurs/partenaire/${partenaireId}`, { headers: getAuthHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur Backend HTTP ${res.status}`);
  const json: ApiResponse<ErreurResponseDTO[]> = await res.json();
  return json.data;
}

export async function deposerContestation(erreurId: number, motif: string, commentaire: string, pieceJointeUrl: string) {
  const url = `${BASE_URL}/contestations/deposer`;
  const payload = { erreurId, motif, commentaire, pieceJointeUrl };
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Erreur Backend HTTP ${res.status}`);
  return await res.json();
}

export async function getContestationsEnAttente(): Promise<ContestationResponseDTO[]> {
  const res = await fetch(`${BASE_URL}/contestations/en-attente`, { headers: getAuthHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error('Erreur récupération contestations');
  const json: ApiResponse<ContestationResponseDTO[]> = await res.json();
  return json.data;
}

export async function traiterContestation(id: number, accepter: boolean, commentaire: string) {
  const res = await fetch(`${BASE_URL}/contestations/${id}/traiter`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ accepter, commentaire })
  });
  if (!res.ok) throw new Error('Erreur lors du traitement');
  return await res.json();
}

export async function getKpiGlobalAdmin(month: number, year: number): Promise<KpiArchiveDTO[]> {
  const res = await fetch(`${BASE_URL}/admin/kpi/global?month=${month}&year=${year}`, { headers: getAuthHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error('Erreur lors de la récupération de la vue globale');
  const json: ApiResponse<KpiArchiveDTO[]> = await res.json();
  return json.data;
}
export async function getAdminUsers(): Promise<UtilisateurDTO[]> {
  const res = await fetch(`${BASE_URL}/admin/users`, { headers: getAuthHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error('Erreur récupération utilisateurs');
  const json = await res.json();
  return json.data;
}

export async function getAdminPartenaires(): Promise<PartenaireDTO[]> {
  const res = await fetch(`${BASE_URL}/admin/users/partenaires`, { headers: getAuthHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error('Erreur récupération partenaires');
  const json = await res.json();
  return json.data;
}

export async function createAdminUser(data: UtilisateurDTO) {
  const res = await fetch(`${BASE_URL}/admin/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Erreur création utilisateur');
  }
}

export async function updateAdminUser(id: number, data: UtilisateurDTO) {
  const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Erreur mise à jour utilisateur');
}

export async function deleteAdminUser(id: number) {
  const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Erreur suppression utilisateur');
}
export async function changePassword(oldPassword: string, newPassword: string) {
  const res = await fetch(`${BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ oldPassword, newPassword })
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Erreur lors du changement de mot de passe');
  }
  
  return await res.json();
}
export async function importErreursExcel(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/admin/erreurs/import`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('kyntus_token')}`
      // Attention: Madirch 'Content-Type': 'multipart/form-data' hna, l'navigateur kaydirha bo7do m3a l'boundary
    },
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Erreur lors de l'importation");
  }

  return await res.json();
}




export async function importMultiCqExcel(file: File, month: number, year: number) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('month', month.toString());
  formData.append('year', year.toString());

  const res = await fetch(`${BASE_URL}/admin/erreurs/import-multi-cq`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('kyntus_token')}` },
    body: formData
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Erreur lors de l'importation Multi-feuilles");
  }
  return await res.json();
}

export async function getCqDataByPartenaire(partenaireId: number, typeFeuille: string, month: number, year: number): Promise<CqDataDTO[]> {
  const res = await fetch(`${BASE_URL}/cq-data/partenaire/${partenaireId}?type=${encodeURIComponent(typeFeuille)}&month=${month}&year=${year}`, { 
    headers: getAuthHeaders(), cache: 'no-store' 
  });
  if (!res.ok) throw new Error('Erreur récupération CQ Data');
  const json = await res.json();
  return json.data;
}

export async function getAdminCqData(typeFeuille: string, month: number, year: number, partenaireId?: string): Promise<CqDataDTO[]> {
  let url = `${BASE_URL}/cq-data/admin?type=${encodeURIComponent(typeFeuille)}&month=${month}&year=${year}`;
  if (partenaireId && partenaireId !== "ALL") {
    url += `&partenaireId=${partenaireId}`;
  }
  const res = await fetch(url, { headers: getAuthHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error('Erreur récupération CQ Data Admin');
  const json = await res.json();
  return json.data;
}
export async function getActivePartenairesForCq(month: number, year: number): Promise<PartenaireDTO[]> {
  const res = await fetch(`${BASE_URL}/cq-data/admin/partenaires-actifs?month=${month}&year=${year}`, { 
    headers: getAuthHeaders(), 
    cache: 'no-store' 
  });
  if (!res.ok) throw new Error('Erreur récupération partenaires actifs');
  const json = await res.json();
  return json.data;
}

// --- ERREURS (ADMIN) ---
export async function getAdminErreurs(partenaireId?: string): Promise<ErreurResponseDTO[]> {
  let url = `${BASE_URL}/admin/erreurs`;
  if (partenaireId && partenaireId !== "ALL") {
    url += `?partenaireId=${partenaireId}`;
  }
  const res = await fetch(url, { headers: getAuthHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error('Erreur récupération erreurs admin');
  const json = await res.json();
  return json.data;
}
export async function importCqPartenaireExcel(file: File, month: number, year: number) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('month', month.toString());
  formData.append('year', year.toString());

  const res = await fetch(`${BASE_URL}/admin/cq-partenaire/import`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('kyntus_token')}` },
    body: formData
  });
  if (!res.ok) throw new Error("Erreur lors de l'importation CQ Partenaire");
  return await res.json();
}

export async function getAdminCqPartenaire(month: number, year: number, partenaireId?: string): Promise<CqPartenaireKpiDTO[]> {
  let url = `${BASE_URL}/admin/cq-partenaire?month=${month}&year=${year}`;
  if (partenaireId && partenaireId !== "ALL") url += `&partenaireId=${partenaireId}`;
  
  const res = await fetch(url, { headers: getAuthHeaders(), cache: 'no-store' });
  if (!res.ok) throw new Error('Erreur récupération CQ Partenaire');
  const json = await res.json();
  return json.data;
}
// ...
export async function importSacliPartenaireExcel(file: File, month: number, year: number) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('month', month.toString());
  formData.append('year', year.toString());

  const res = await fetch(`${BASE_URL}/admin/cq-partenaire/import-sacli`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('kyntus_token')}` },
    body: formData
  });
  if (!res.ok) throw new Error("Erreur lors de l'importation SACLI");
  return await res.json();
}

export async function importSarcliPartenaireExcel(file: File, month: number, year: number) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('month', month.toString());
  formData.append('year', year.toString());

  const res = await fetch(`${BASE_URL}/admin/cq-partenaire/import-sarcli`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('kyntus_token')}` },
    body: formData
  });
  if (!res.ok) throw new Error("Erreur lors de l'importation SARCLI");
  return await res.json();
}
export async function getPartenaireCqKpis(partenaireId: number, month: number, year: number): Promise<CqPartenaireKpiDTO[]> {
  const res = await fetch(`${BASE_URL}/cq-partenaire/partenaire/${partenaireId}?month=${month}&year=${year}`, { 
    headers: getAuthHeaders(), 
    cache: 'no-store' 
  });
  if (!res.ok) throw new Error('Erreur récupération Indicateurs CQ');
  const json = await res.json();
  return json.data;
}
export async function importIncoherencePtoExcel(file: File, month: number, year: number) {
  const formData = new FormData(); formData.append('file', file); formData.append('month', month.toString()); formData.append('year', year.toString());
  const res = await fetch(`${BASE_URL}/admin/cq-partenaire/import-incoherence-pto`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('kyntus_token')}` }, body: formData });
  if (!res.ok) throw new Error("Erreur importation Incohérence PTO");
  return await res.json();
}

export async function importGemNokExcel(file: File, month: number, year: number) {
  const formData = new FormData(); formData.append('file', file); formData.append('month', month.toString()); formData.append('year', year.toString());
  const res = await fetch(`${BASE_URL}/admin/cq-partenaire/import-gem-nok`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('kyntus_token')}` }, body: formData });
  if (!res.ok) throw new Error("Erreur importation GEM NOK");
  return await res.json();
}

export async function importCadrageExcel(file: File, month: number, year: number) {
  const formData = new FormData(); formData.append('file', file); formData.append('month', month.toString()); formData.append('year', year.toString());
  const res = await fetch(`${BASE_URL}/admin/cq-partenaire/import-cadrage`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('kyntus_token')}` }, body: formData });
  if (!res.ok) throw new Error("Erreur importation CADRAGE");
  return await res.json();
}
export async function importTauxPlainteExcel(file: File, month: number, year: number) {
  const formData = new FormData(); formData.append('file', file); formData.append('month', month.toString()); formData.append('year', year.toString());
  const res = await fetch(`${BASE_URL}/admin/cq-partenaire/import-taux-plainte`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('kyntus_token')}` }, body: formData });
  if (!res.ok) throw new Error("Erreur importation TAUX DE PLAINTE");
  return await res.json();
}