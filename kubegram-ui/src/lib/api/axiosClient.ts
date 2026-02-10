import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090';

// Flag to prevent multiple refresh token requests simultaneously
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

/**
 * Process the failed queue after token refresh
 */
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token || undefined);
    }
  });

  failedQueue = [];
};

/**
 * Create centralized axios client with auth interceptors
 */
export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add auth token and Kubegram headers to requests
  client.interceptors.request.use(
    async (config) => {
      // Ensure headers object exists
      if (!config.headers) {
        config.headers = new axios.AxiosHeaders();
      }

      let token: string | null = null;
      let userId: string | null = null;

      // Get auth data from localStorage
      const authData = localStorage.getItem('kubegram_auth');
      if (authData) {
        try {
          const parsedAuth = JSON.parse(authData);

          // Get token and userId
          if (parsedAuth.accessToken) {
            token = parsedAuth.accessToken;
            // Add Authorization header
            config.headers.Authorization = `Bearer ${parsedAuth.accessToken}`;
          }

          if (parsedAuth.user?.id) {
            userId = parsedAuth.user.id;
          }
        } catch (error) {
          console.error('Failed to parse auth data from localStorage:', error);
        }
      }

      // Helper to perform authenticated raw requests to avoid circular dependency with apiClient
      const fetchEntity = async (url: string, token: string) => {
        try {
          const response = await axios.get(`${API_BASE_URL}${url}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return response.data;
        } catch (error) {
          console.warn(`Failed to auto-fetch context from ${url}:`, error);
          return null;
        }
      };

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

      // If missing team but have user+token, try to fetch
      if (!teamId && userId && token) {
        // Prevent infinite loops: Don't refetch if the request is trying to fetch teams/user info
        if (!config.url?.includes('/api/v1/teams') && !config.url?.includes('/api/v1/users')) {
          const team = await fetchEntity(`/api/v1/teams?userId=${userId}`, token);
          if (team?.id) {
            teamId = team.id;
            localStorage.setItem('x-kubegram-current-team', JSON.stringify(team));
            // Also update the teams list cache if possible, but minimal side effects is better for interceptor
          }
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

      // If missing org but have team+token, try to fetch
      if (!orgId && teamId && token) {
        if (!config.url?.includes('/api/v1/organizations')) {
          const org = await fetchEntity(`/api/v1/organizations?teamId=${teamId}`, token);
          if (org?.id) {
            orgId = org.id;
            localStorage.setItem('x-kubegram-current-organization', JSON.stringify(org));
          }
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

      // If missing company but have org+token, try to fetch
      if (!companyId && orgId && token) {
        if (!config.url?.includes('/api/v1/companies')) {
          const company = await fetchEntity(`/api/v1/companies?organizationId=${orgId}`, token);
          if (company?.id) {
            companyId = company.id;
            localStorage.setItem('x-kubegram-current-company', JSON.stringify(company));
          }
        }
      }

      if (companyId) {
        config.headers['X-Kubegram-Company-Id'] = companyId;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle 401 errors and token refresh
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      // Handle 400 Bad Request - invalidate token
      if (error.response?.status === 400) {
        // Clear auth data
        localStorage.removeItem('kubegram_auth');

        // Dispatch custom event to trigger login modal
        window.dispatchEvent(new CustomEvent('triggerLoginModal', {
          detail: {
            reason: 'invalid_token',
            message: 'Your session is invalid. Please log in again.'
          }
        }));

        return Promise.reject(error);
      }

      // Handle 401 Unauthorized errors
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          // If already refreshing, queue the request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return client(originalRequest);
          }).catch((err) => {
            return Promise.reject(err);
          });
        }

        isRefreshing = true;

        try {
          // Dispatch token refresh action
          const authData = localStorage.getItem('oauth');
          if (authData) {
            const parsedAuth = JSON.parse(authData);
            const refreshToken = parsedAuth.state?.refreshToken;

            if (refreshToken) {
              // Call token refresh endpoint
              const refreshResponse = await axios.post(
                `${API_BASE_URL}/api/v1/public/auth/refresh`,
                { refreshToken },
                { headers: { 'Content-Type': 'application/json' } }
              );

              const newTokens = refreshResponse.data;

              // Update localStorage with new tokens
              const updatedAuthData = {
                ...parsedAuth,
                state: {
                  ...parsedAuth.state,
                  accessToken: newTokens.accessToken,
                  refreshToken: newTokens.refreshToken || refreshToken,
                },
              };
              localStorage.setItem('oauth', JSON.stringify(updatedAuthData));

              // Process the queue with new token
              processQueue(null, newTokens.accessToken);

              // Retry the original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              }
              return client(originalRequest);
            }
          }

          // No refresh token available, dispatch login modal
          throw new Error('No refresh token available');
        } catch (refreshError) {
          // Token refresh failed, dispatch login modal
          processQueue(refreshError, null);

          // Clear auth data and trigger login modal
          localStorage.removeItem('oauth');

          // Dispatch custom event to trigger login modal
          window.dispatchEvent(new CustomEvent('triggerLoginModal', {
            detail: {
              reason: 'token_expired',
              message: 'Your session has expired. Please log in again.'
            }
          }));

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Handle 403 Forbidden errors
      if (error.response?.status === 403) {
        // Clear auth data
        localStorage.removeItem('oauth');
        localStorage.removeItem('kubegram_auth');

        // Dispatch custom event to trigger login modal
        window.dispatchEvent(new CustomEvent('triggerLoginModal', {
          detail: {
            reason: 'access_denied',
            message: 'You do not have permission to access this resource. Please log in with appropriate credentials.'
          }
        }));

        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Create and export the singleton API client instance
export const apiClient = createApiClient();

/**
 * Helper function to get API config with auth token
 * Updated to preserve interceptor headers while adding/overriding Authorization
 */
export const getApiConfig = (token?: string): AxiosRequestConfig => {
  const baseConfig: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    // Only add Authorization header if token is provided
    // This will override any Authorization header from interceptors
    return {
      ...baseConfig,
      headers: {
        ...baseConfig.headers,
        'Authorization': `Bearer ${token}`,
      },
    };
  }

  return baseConfig;
};