/**
 * API Client
 * Authenticated fetch wrapper that injects Clerk JWT tokens
 * All requests go to the speech.fm backend
 */

import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://speech.fm';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

let getTokenFn: (() => Promise<string | null>) | null = null;

export function setAuthTokenProvider(fn: () => Promise<string | null>) {
  getTokenFn = fn;
}

export async function apiClient<T = any>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Platform', 'mobile');

  if (!skipAuth && getTokenFn) {
    const token = await getTokenFn();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new ApiError(response.status, errorText, path);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return response as any;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
    public path: string
  ) {
    super(`API ${status} ${path}: ${body}`);
    this.name = 'ApiError';
  }
}

// Raw fetch for binary responses (audio, etc.)
export async function apiRawFetch(
  path: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipAuth, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  headers.set('X-Platform', 'mobile');

  if (!skipAuth && getTokenFn) {
    const token = await getTokenFn();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const url = `${API_BASE_URL}${path}`;
  return fetch(url, { ...fetchOptions, headers });
}

export { API_BASE_URL };
