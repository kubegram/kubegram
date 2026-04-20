import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { authClient } from '../auth/client';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Use relative URL in development to leverage Vite proxy (avoids CORS)
// Use full URL in production
const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8090');

/**
 * Create centralized axios client with session cookie support
 * Uses HTTP-only cookies for authentication (no Bearer tokens)
 */
export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // Required for HTTP-only session cookies
  });

  // Request interceptor - Add Kubegram context headers
  client.interceptors.request.use(
    async (config) => {
      // Ensure headers object exists
      if (!config.headers) {
        config.headers = new axios.AxiosHeaders();
      }

      // 1. Team Context
      let teamId: string | null = null;
      const teamData = localStorage.getItem('x-kubegram-current-team');

      if (teamData) {
        try {
          const team = JSON.parse(teamData);
          if (team?.id) teamId = team.id;
        } catch (e) {
          console.error('Failed to parse team data', e);
        }
      }

      if (teamId) {
        config.headers['X-Kubegram-Team-Id'] = teamId;
      }

      // 2. Organization Context (Dependent on Team)
      let orgId: string | null = null;
      const orgData = localStorage.getItem('x-kubegram-current-organization');

      if (orgData) {
        try {
          const org = JSON.parse(orgData);
          if (org?.id) orgId = org.id;
        } catch (e) {
          console.error('Failed to parse org data', e);
        }
      }

      if (orgId) {
        config.headers['X-Kubegram-Organization-Id'] = orgId;
      }

      // 3. Company Context (Dependent on Organization)
      let companyId: string | null = null;
      const companyData = localStorage.getItem('x-kubegram-current-company');

      if (companyData) {
        try {
          const company = JSON.parse(companyData);
          if (company?.id) companyId = company.id;
        } catch (e) {
          console.error('Failed to parse company data', e);
        }
      }

      if (companyId) {
        config.headers['X-Kubegram-Company-Id'] = companyId;
      }

      // 4. Bearer token (PKCE flow)
      const accessToken = sessionStorage.getItem('access_token');
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle auth errors
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableRequestConfig | undefined;

      // Handle 401 Unauthorized - attempt token refresh before triggering login modal
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = sessionStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const result = await authClient.refresh(refreshToken);
            if (!result.err && result.tokens) {
              sessionStorage.setItem('access_token', result.tokens.access);
              sessionStorage.setItem('refresh_token', result.tokens.refresh);
              originalRequest.headers['Authorization'] = `Bearer ${result.tokens.access}`;
              return client(originalRequest);
            }
          } catch {
            // fall through to login modal
          }
        }
        window.dispatchEvent(new CustomEvent('triggerLoginModal', {
          detail: {
            reason: 'session_expired',
            message: 'Your session has expired. Please log in again.'
          }
        }));
      }

      // Handle 403 Forbidden errors
      if (error.response?.status === 403) {
        // Dispatch custom event to trigger login modal
        window.dispatchEvent(new CustomEvent('triggerLoginModal', {
          detail: {
            reason: 'access_denied',
            message: 'You do not have permission to access this resource. Please log in with appropriate credentials.'
          }
        }));
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Create and export the singleton API client instance
export const apiClient = createApiClient();

/**
 * Helper function to get API config
 * Session cookie is sent automatically with withCredentials: true
 */
export const getApiConfig = (): AxiosRequestConfig => {
  return {
    headers: {
      'Content-Type': 'application/json',
    },
  };
};