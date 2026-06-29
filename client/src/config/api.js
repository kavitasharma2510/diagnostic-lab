const DEFAULT_API_URL = 'https://diagnostic-lab-rbdo.onrender.com';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '');

export function apiUrl(path = '') {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalized}`;
}
