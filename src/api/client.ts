import axios, { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/types/api';

const TOKEN_STORAGE_KEY = 'defia_book_token';

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
}

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function subscribeUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const reqUrl = error.config?.url ?? '';
    const isAuthEndpoint = reqUrl.includes('/auth/login') || reqUrl.includes('/auth/register');

    if (status === 401 && !isAuthEndpoint) {
      setStoredToken(null);
      unauthorizedListeners.forEach((cb) => cb());
    }

    return Promise.reject(error);
  }
);

export function extractApiErrorMessage(err: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (axios.isAxiosError<ApiErrorResponse>(err)) {
    const data = err.response?.data;
    if (data?.details && data.details.length > 0) {
      return `${data.message}: ${data.details.map((d) => d.message).join(' · ')}`;
    }
    if (data?.message) return data.message;
    if (err.message === 'Network Error') {
      return `No se pudo conectar con el servidor (${API_BASE_URL}). Verifica que el backend esté activo.`;
    }
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
