import axios, { AxiosError } from 'axios';
import { showApiErrorToast } from '../utils/notificationService';

const AUTH_TOKEN_KEY = 'semas_auth_token';
const AUTH_USER_KEY = 'semas_auth_user';

export function clearAuthSession(): void {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem(AUTH_TOKEN_KEY);
    storage.removeItem(AUTH_USER_KEY);
  }
}

export function getAuthStorage(): Storage {
  if (localStorage.getItem(AUTH_TOKEN_KEY)) {
    return localStorage;
  }

  return sessionStorage;
}

export function storeAuthSession(
  token: string,
  user: unknown,
  remember: boolean,
): void {
  clearAuthSession();

  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(AUTH_TOKEN_KEY, token);
  storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

function createRequestId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `web-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function sanitizeForConsole(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeForConsole);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        /password|token|authorization|cookie|secret|key/i.test(key)
          ? '[REDACTED]'
          : sanitizeForConsole(entryValue),
      ]),
    );
  }

  return value;
}

function logApiError(error: AxiosError): void {
  const method = error.config?.method?.toUpperCase() ?? 'REQUEST';
  const url = error.config ? api.getUri(error.config) : 'URL desconhecida';
  const status = error.response?.status;
  const requestId =
    error.response?.headers['x-request-id'] ??
    error.config?.headers?.['X-Request-ID'];

  console.groupCollapsed(
    `[API] ${method} ${url} -> ${status ?? error.code ?? 'erro'}`,
  );
  console.error('Falha na requisição da API', {
    requestId,
    status,
    statusText: error.response?.statusText,
    axiosCode: error.code,
    message: error.message,
    response: sanitizeForConsole(error.response?.data),
  });
  console.groupEnd();
}

api.interceptors.request.use((config) => {
  const token = getAuthStorage().getItem(AUTH_TOKEN_KEY);

  config.headers['X-Request-ID'] = createRequestId();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    logApiError(error);

    const isLoginRequest = error.config?.url === '/login';
    const isCanceledRequest = error.code === 'ERR_CANCELED';

    if (
      !isLoginRequest &&
      !isCanceledRequest &&
      error.response?.status !== 401
    ) {
      showApiErrorToast(error);
    }

    if (error.response?.status === 401) {
      clearAuthSession();

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export { AUTH_TOKEN_KEY, AUTH_USER_KEY };
