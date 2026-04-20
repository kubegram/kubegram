/**
 * OAuth Slice Types
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  provider: string;
  providerId: string;
  avatarUrl?: string;
}

export interface OAuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  availableProviders: AuthProvider[];
}

export type OAuthProvider =
  | 'github'
  | 'google'
  | 'gmail'
  | 'slack'
  | 'gitlab'
  | 'okta'
  | 'oidc'
  | 'sso'
  | 'password';

export interface AuthProvider {
  id: OAuthProvider;
  name: string;
  authUrl: string;
  registerUrl?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface OpenAuthTokens {
  access: string;
  refresh?: string;
  expires_in?: number;
  token_type?: string;
}
