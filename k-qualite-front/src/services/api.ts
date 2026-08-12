const BASE_URL = 'http://localhost:8256/api/v1';

export const fetchDashboardData = async (partenaireId: number) => {
    const res = await fetch(`${BASE_URL}/dashboard/partenaire/${partenaireId}`);
    if (!res.ok) throw new Error('Failed to fetch dashboard');
    return res.json(); // Kay-rejje3 l'ApiResponse (Data)
};

export const fetchErreurs = async (partenaireId: number) => {
    const res = await fetch(`${BASE_URL}/erreurs/partenaire/${partenaireId}`);
    if (!res.ok) throw new Error('Failed to fetch erreurs');
    return res.json();
};