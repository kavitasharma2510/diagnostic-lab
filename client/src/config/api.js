const DEFAULT_API_URL = 'https://diagnostic-lab-rbdo.onrender.com';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '');

export function apiUrl(path = '') {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalized}`;
}

/** PDF preview/download — use Vite proxy in dev to avoid CORS and hit local API. */
export function mediaUrl(path = '') {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (import.meta.env.DEV) {
        return normalized;
    }
    return apiUrl(normalized);
}
