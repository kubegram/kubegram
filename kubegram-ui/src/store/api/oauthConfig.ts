import { createAsyncThunk } from '@reduxjs/toolkit';
import type { OAuthProvider } from '../slices/oauth/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090';

export const getProviderConfig = createAsyncThunk(
  'oauth/getProviderConfig',
  async (provider: OAuthProvider, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/public/auth/${provider}/config`);

      if (!response.ok) {
        throw new Error(`Failed to get config for ${provider}`);
      }

      return await response.json();
    } catch (error: unknown) {
      return rejectWithValue((error as Error).message || 'Failed to get provider configuration');
    }
  }
);

export const getProviderScopes = async (provider: OAuthProvider): Promise<string[]> => {
  switch (provider) {
    case 'gmail':
      return [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ];
    case 'slack':
      return [
        'users:read',
        'users:read.email',
        'team:read',
        'channels:read'
      ];
    case 'google':
      return [
        'openid',
        'email',
        'profile'
      ];
    case 'github':
      return [
        'user:email',
        'read:user'
      ];
    case 'gitlab':
      return [
        'read_user',
        'openid',
        'profile',
        'email'
      ];
    case 'okta':
    case 'oidc':
      return [
        'openid',
        'profile',
        'email'
      ];
    case 'sso':
      return [
        'openid',
        'profile',
        'email'
      ];
    default:
      return ['openid', 'profile', 'email'];
  }
};
