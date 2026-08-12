import { ApiResponse, DashboardPartenaireDTO, ErreurResponseDTO, ContestationResponseDTO, KpiArchiveDTO } from '../types/api';

// 🛡️ L'FIX HWA HNA: Séparation bin SSR (Docker) w Client (Navigateur)
const isServer = typeof window === 'undefined';

const BASE_URL = isServer 
  ? 'http://kq_backend:8256/api/v1' // Mli Next.js kay-fetchi mn weste Docker (SSR)
  : (process.env.NEXT_PUBLIC_API_URL || 'http://10.10.10.25:8256/api/v1'); // Mli l'Navigateur kay-fetchi (Client)

export async function getDashboardData(partenaireId: number = 1): Promise<DashboardPartenaireDTO> {
  const url = `${BASE_URL}/dashboard/partenaire/${partenaireId}?periodeMois=2026-08`;
  const res = await fetch(url, { cache: 'no-store' });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erreur Backend HTTP ${res.status}: ${errorText}`);
  }
  
  const json: ApiResponse<DashboardPartenaireDTO> = await res.json();
  return json.data;
}

export async function getErreurs(partenaireId: number = 1): Promise<ErreurResponseDTO[]> {
  const res = await fetch(`${BASE_URL}/erreurs/partenaire/${partenaireId}`, { cache: 'no-store' });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erreur Backend HTTP ${res.status}: ${errorText}`);
  }
  
  const json: ApiResponse<ErreurResponseDTO[]> = await res.json();
  return json.data;
}

export async function deposerContestation(erreurId: number, motif: string, commentaire: string, pieceJointeUrl: string) {
  const url = `${BASE_URL}/contestations/deposer`;
  
  const payload = {
    erreurId,
    motif,
    commentaire,
    pieceJointeUrl
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Utilisateur-Id': '1' 
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erreur Backend HTTP ${res.status}: ${errorText}`);
  }

  return await res.json();
}

export async function getContestationsEnAttente(): Promise<ContestationResponseDTO[]> {
  const res = await fetch(`${BASE_URL}/contestations/en-attente`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Erreur récupération contestations');
  const json: ApiResponse<ContestationResponseDTO[]> = await res.json();
  return json.data;
}

export async function traiterContestation(id: number, accepter: boolean, commentaire: string) {
  const res = await fetch(`${BASE_URL}/contestations/${id}/traiter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accepter, commentaire })
  });
  if (!res.ok) throw new Error('Erreur lors du traitement');
  return await res.json();
}

export async function getKpiGlobalAdmin(month: number, year: number): Promise<KpiArchiveDTO[]> {
  const res = await fetch(`${BASE_URL}/admin/kpi/global?month=${month}&year=${year}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Erreur lors de la récupération de la vue globale');
  const json: ApiResponse<KpiArchiveDTO[]> = await res.json();
  return json.data;
}