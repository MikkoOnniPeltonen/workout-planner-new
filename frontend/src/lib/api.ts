import type { ApiErrorBody } from '@workout-planner/shared';
import axios from 'axios';
import { cachedResponse, cacheKey, cacheResponse, currentOwner } from './offline-cache';

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL ?? '/api',
  withCredentials: true,
  timeout: 15_000,
  headers: { 'X-CSRF-Protection': '1' },
});

declare module 'axios' {
  interface AxiosRequestConfig {
    workoutCacheKey?: string;
  }
}
api.interceptors.request.use((config) => {
  if (
    !['get', 'head', 'options'].includes(config.method ?? 'get') &&
    !config.url?.startsWith('/auth/') &&
    currentOwner() &&
    !config.headers['X-Session-Owner']
  )
    config.headers['X-Session-Owner'] = currentOwner();
  if (config.method === 'get' && !config.url?.startsWith('/auth/'))
    config.workoutCacheKey = cacheKey(config.url ?? '', config.params);
  return config;
});

let unauthorizedHandler: (() => void) | undefined;

/** Registers what happens when an authenticated request is rejected, e.g. an expired token. */
export function setUnauthorizedHandler(handler: () => void): () => void {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = undefined;
    }
  };
}

api.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get' && !response.config.url?.startsWith('/auth/'))
      cacheResponse(
        response.config.workoutCacheKey ??
          cacheKey(response.config.url ?? '', response.config.params),
        response.data,
      );
    return response;
  },
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      !error.response &&
      error.config?.method === 'get' &&
      !error.config.url?.startsWith('/auth/')
    ) {
      const data = cachedResponse(
        error.config.workoutCacheKey ?? cacheKey(error.config.url ?? '', error.config.params),
      );
      if (data !== null)
        return {
          data,
          status: 200,
          statusText: 'Offline cache',
          headers: {},
          config: error.config,
        };
    }
    // Login failures are shown by the form; other 401s require reauthentication.
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.startsWith('/auth/')
    ) {
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return 'Cannot reach the server. Check your connection and try again.';
    }
    return error.response.data?.message ?? fallback;
  }
  return fallback;
}
