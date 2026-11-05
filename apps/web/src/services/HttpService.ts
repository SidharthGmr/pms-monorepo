import config from '@/config';
import { mediaUrl } from '@/lib/media-url';
import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { injectable } from 'inversify';
import { getSession, signOut } from 'next-auth/react';
import IHttpService from './interfaces/IHttpService';

/**
 * The database stores uploaded media as bare file names; components expect fetchable URLs.
 * Rather than prefixing at every <img> in the tree, every API response is walked once here
 * and the known media fields are rebuilt with NEXT_PUBLIC_MEDIA_BASE_URL (mediaUrl leaves
 * full paths and absolute URLs untouched, so legacy rows pass through unchanged).
 */
const MEDIA_FIELDS = new Set(['images', 'image', 'imageUrl', 'profileImageUrl', 'storeLogo', 'logoUrl', 'thumbnailUrl']);

const normalizeMediaFields = (node: unknown, depth = 0): void => {
  if (!node || typeof node !== 'object' || depth > 8) return;
  if (Array.isArray(node)) {
    node.forEach((item) => normalizeMediaFields(item, depth + 1));
    return;
  }
  const record = node as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const value = record[key];
    if (MEDIA_FIELDS.has(key)) {
      if (typeof value === 'string') record[key] = mediaUrl(value);
      else if (Array.isArray(value) && value.every((item) => typeof item === 'string')) record[key] = value.map((item) => mediaUrl(item as string));
      else normalizeMediaFields(value, depth + 1);
    } else if (value && typeof value === 'object') {
      normalizeMediaFields(value, depth + 1);
    }
  }
};

@injectable()
export default class HttpService implements IHttpService {
  private readonly baseUrl: string;
  private readonly clientId: string;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
    this.clientId = config.clientId;
  }

  // Unauthenticated endpoints (signup, login, refresh): same baseURL and clientId
  // gate as `call()`, but no bearer token and no 401 interceptor - a 401 here is a
  // real answer, not an expired session to refresh.
  externalCall(contentType: string = 'application/json'): AxiosInstance {
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        clientId: this.clientId,
        'Content-Type': contentType,
      },
      validateStatus: (status) => {
        return status < 500; // Resolve only if the status code is less than 500
      },
    });
  }

  call(contentType: string = 'application/json'): AxiosInstance {
    const instance = axios.create({
      baseURL: this.baseUrl,
      withCredentials: false,
      headers: {
        clientId: this.clientId,
        'Content-Type': contentType,
      },
      validateStatus: (status) => {
        return status < 500; // Resolve only if the status code is less than 500
      },
    });

    if (typeof window !== 'undefined' && localStorage) {
      const token = localStorage.getItem('at');
      if (token) {
        instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    }

    instance.interceptors.response.use(
      // `validateStatus` resolves every status below 500, so a 401 arrives here as a normal
      // response. The refresh used to sit in the rejected branch below, which only ever sees
      // 5xx and network errors, so an expired token was never renewed.
      async (response: AxiosResponse) => {
        const originalRequest = response.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (response.status >= 200 && response.status < 300) normalizeMediaFields(response.data);

        if (response.status !== 401 || originalRequest._retry || typeof window === 'undefined') {
          // 403 is left for the caller to show. A blanket redirect to /access-denied would
          // fire for "no store assigned" too, and middleware.ts turns a direct visit to that
          // page into page-not-found, so it never helped.
          return response;
        }

        originalRequest._retry = true;

        try {
          // Calling getSession() forces NextAuth's jwt callback to run, which refreshes an
          // expired access token (see options.ts).
          const session = await getSession();

          if ((session as any)?.error === 'RefreshAccessTokenError') {
            // The refresh token is expired or revoked too. Force logout.
            localStorage.removeItem('at');
            await signOut({ callbackUrl: '/' });
            return response;
          }

          const newToken = (session?.user as any)?.token;
          if (!newToken) return response;

          localStorage.setItem('at', newToken);
          instance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

          // Retry the original request once with the new token.
          return instance(originalRequest);
        } catch {
          // Failsafe logout if the refresh itself throws.
          localStorage.removeItem('at');
          await signOut({ callbackUrl: '/' });
          return response;
        }
      },
      (error: Error | AxiosError) => {
        // Only 5xx and network failures land here.
        return Promise.reject(error);
      }
    );

    return instance;
  }
}
