import { createAsyncThunk } from '@reduxjs/toolkit';
import type { OAuthProvider } from './types';
import { openAuthApi } from '../../api/openauth';
import { fetchCurrentUser } from '../../api/userApi';
import { fetchTeamByUserId } from '../../api/teamApi';
import { fetchOrganizationByTeamId } from '../../api/organizationApi';
import { fetchCompanyByOrganizationId } from '../../api/companyApi';
import { setCurrentTeam } from '../team/teamSlice';
import { setCurrentOrganization } from '../organization/organizationSlice';
import { setCurrentCompany } from '../company/companySlice';

// Helper to get current origin for callback URL
const getCallbackUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin + '/auth/callback';
  }
  return 'http://localhost:8090/auth/callback';
};

export const initiateLogin = createAsyncThunk(
  'oauth/initiateLogin',
  async (provider: OAuthProvider, { rejectWithValue }) => {
    try {
      const callbackUrl = getCallbackUrl();

      // Save current path for reuse after login, excluding auth routes
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        if (!currentPath.includes('/login') && !currentPath.includes('/auth/callback')) {
          localStorage.setItem('oauth_redirect_path', currentPath);
        }
      }

      // Initiate OAuth flow using OpenAuth
      const result = await openAuthApi.initiateLogin(provider, callbackUrl);

      return result; // The page will navigate away via OpenAuth redirect
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || 'Failed to initiate login');
    }
  }
);

export const handleCallback = createAsyncThunk(
  'oauth/handleCallback',
  async ({ code }: { provider: string; code: string; state?: string }, { rejectWithValue }) => {
    try {
      const callbackUrl = getCallbackUrl();

      // Exchange authorization code for tokens using OpenAuth
      const tokens = await openAuthApi.exchangeCodeForTokens(callbackUrl, code);

      // TODO: Get user information from backend using access token
      // For now, we'll need to create a user object from OAuth provider info
      // This will need to be implemented based on your backend user endpoint

      // Temporary user object - this should be replaced with actual user data from your backend
      // We don't get user info from the token exchange directly
      // The OAuthCallback component will handle fetching the user if needed
      const user = await fetchCurrentUser(tokens.accessToken);

      console.log('✅ OAuth callback handled successfully for user:', JSON.stringify(user, null, 2));

      return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: tokens.tokenType,
      };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || 'Failed to complete authentication');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'oauth/refreshToken',
  async (refreshToken: string, { rejectWithValue }) => {
    try {
      const tokens = await openAuthApi.refreshAccessToken(refreshToken);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: tokens.tokenType
      };
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || 'Failed to refresh token');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'oauth/logout',
  async (accessToken: string | null, { rejectWithValue }) => {
    try {
      if (accessToken) {
        await openAuthApi.revokeToken(accessToken);
      }
      return null;
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || 'Failed to logout');
    }
  }
);

/**
 * Fetch user context (team, organization, company) after login
 */
export const fetchUserContext = createAsyncThunk(
  'oauth/fetchUserContext',
  async ({ userId, accessToken }: { userId: string; accessToken: string }, { dispatch, rejectWithValue }) => {
    try {
      console.log('🔍 Fetching user context for userId:', userId);

      // Step 1: Fetch team by user ID
      const team = await fetchTeamByUserId(userId, accessToken);
      if (team) {
        console.log('👥 Found team:', team.name);
        dispatch(setCurrentTeam(team));

        // Step 2: Fetch organization by team ID
        const organization = await fetchOrganizationByTeamId(team.id, accessToken);
        if (organization) {
          console.log('🏢 Found organization:', organization.name);
          dispatch(setCurrentOrganization(organization));

          // Step 3: Fetch company by organization ID
          const company = await fetchCompanyByOrganizationId(organization.id, accessToken);
          if (company) {
            console.log('🏭 Found company:', company.name);
            dispatch(setCurrentCompany(company));
          } else {
            console.warn('⚠️ No company found for organization');
          }
        } else {
          console.warn('⚠️ No organization found for team');
        }
      } else {
        console.warn('⚠️ No team found for user');
      }

      return { team, organization: null, company: null };
    } catch (error: unknown) {
      console.error('❌ Failed to fetch user context:', error);
      return rejectWithValue((error as Error).message || 'Failed to fetch user context');
    }
  }
);
