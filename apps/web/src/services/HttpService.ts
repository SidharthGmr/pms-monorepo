import config from '@/config';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { injectable } from 'inversify';
import { getSession, signOut } from 'next-auth/react';
import IHttpService from './interfaces/IHttpService';

@injectable()
export default class HttpService implements IHttpService {
  private readonly baseUrl: string;
  private readonly clientId: string;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
    this.clientId = config.clientId;
  }

  externalCall(contentType: string = 'application/json'): AxiosInstance {
    return axios.create({
      headers: {
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
      (response) => {
        return response;
      },
      async (error: Error | AxiosError) => {
        const originalRequest = (error as any).config;

        // Handle 401 Unauthorized - Attempt to Auto-Renew Token
        if (axios.isAxiosError(error) && error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Calling getSession() forces NextAuth's jwt callback to run.
            // If the token is expired, NextAuth will auto-refresh it based on the logic in options.ts
            const session = await getSession();

            if ((session as any)?.error === "RefreshAccessTokenError") {
              // Refresh token is completely expired or invalid. Force logout.
              localStorage.removeItem('at');
              await signOut({ callbackUrl: '/' });
              return Promise.reject(error);
            }

            const newToken = (session?.user as any)?.token;
            if (newToken) {
              // Update local storage and headers with the brand new token
              localStorage.setItem('at', newToken);
              instance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

              // Retry the original failed request invisibly
              return instance(originalRequest);
            }
          } catch (refreshError) {
            // Failsafe logout if refresh throws an unexpected error
            localStorage.removeItem('at');
            await signOut({ callbackUrl: '/' });
            return Promise.reject(refreshError);
          }
        }

        // Handle 403 Forbidden - Access Denied
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          if (typeof window !== 'undefined') {
            window.location.href = '/access-denied';
          }
        }

        const statusCode: number = (error as AxiosError)?.response?.status || 0;
        if (statusCode >= 400 && statusCode < 500) {
          return Promise.reject(error);
        }

        // Handle global error here if needed

        return Promise.reject(error);
      }
    );

    return instance;
  }
}
