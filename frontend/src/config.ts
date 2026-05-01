const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:4000' : '');

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');
