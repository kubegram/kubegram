import { createAsyncThunk } from '@reduxjs/toolkit';
import type { OAuthProvider, User, AuthProvider } from './types';
import { fetchTeamByUserId } from '../../api/teamApi';
import { fetchOrganizationByTeamId } from '../../api/organizationApi';
import { fetchCompanyByOrganizationId } from '../../api/companyApi';
import { fetchAuthProviders } from '../../api/userApi';
import { setCurrentTeam } from '../team/teamSlice';
import { setCurrentOrganization } from '../organization/organizationSlice';
import { setCurrentCompany } from '../company/companySlice';
import { authClient, CALLBACK_URL } from '@/lib/auth/client';

// Use relative URL in development to leverage Vite proxy (avoids CORS)
// Use full URL in production
const getApiUrl = (): string => import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8090');

export const initiateLogin = createAsyncThunk(
  'oauth/initiateLogin',
  async (provider: OAuthProvider | null, { rejectWithValue }) => {
    try {
      const currentPath = window.location.pathname + window.location.search;
      if (!currentPath.includes('/oauth/callback')) {
        localStorage.setItem('oauth_redirect_path', currentPath);
      }

      // For password provider or provider selection page, redirect directly to backend
      // The backend handles these with server-rendered forms
      const apiUrl = getApiUrl();
      if (!provider || provider === 'password') {
        const redirectUrl = provider
          ? `${apiUrl}/oauth/${provider}/authorize`
          : `${apiUrl}/oauth/authorize`;
        window.location.href = redirectUrl;
        return { initiated: true };
      }

      // For OAuth providers (github, google, etc.), use PKCE client-side flow
      const { url, challenge } = await authClient.authorize(
        CALLBACK_URL,
        'code',
        {
          pkce: true,
          provider,
        }
      );

      sessionStorage.setItem('pkce_challenge', JSON.stringify(challenge));
      window.location.href = url;

      return { initiated: true };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || 'Failed to initiate login');
    }
  }
);

export const fetchAvailableProviders = createAsyncThunk(
  'oauth/fetchAvailableProviders',
  async (_, { rejectWithValue }): Promise<AuthProvider[]> => {
    try {
      return await fetchAuthProviders();
    } catch {
      return rejectWithValue('Failed to fetch providers') as any;
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'oauth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = sessionStorage.getItem('access_token');

      const response = await fetch(`${getApiUrl()}/api/public/v1/auth/me`, {
        method: 'GET',
        credentials: 'include', // enables session-cookie fallback for password auth
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        if (response.status === 401) return { isAuthenticated: false, user: null };
        throw new Error(`Auth check failed: ${response.status}`);
      }

      const data = await response.json();
      return { isAuthenticated: true, user: data.user as User };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || 'Failed to check authentication');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'oauth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = sessionStorage.getItem('access_token');
      await fetch(`${getApiUrl()}/api/public/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      localStorage.removeItem('oauth_redirect_path');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');

      return null;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || 'Failed to logout');
    }
  }
);

export const fetchUserContext = createAsyncThunk(
  'oauth/fetchUserContext',
  async (userId: string, { dispatch, rejectWithValue }) => {
    try {
      const team = await fetchTeamByUserId(userId);
      if (team) {
        dispatch(setCurrentTeam(team));

        const organization = await fetchOrganizationByTeamId(team.id);
        if (organization) {
          dispatch(setCurrentOrganization(organization));

          const company = await fetchCompanyByOrganizationId(organization.id);
          if (company) {
            dispatch(setCurrentCompany(company));
          }
        }
      }

      return { team, organization: null, company: null };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || 'Failed to fetch user context');
    }
  }
);
