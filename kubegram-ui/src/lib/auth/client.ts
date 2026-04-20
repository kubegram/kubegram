import { createClient } from '@openauthjs/openauth/client';

// Use relative URL in development to leverage Vite proxy (avoids CORS)
// Use full URL in production
const oauthBaseUrl = import.meta.env.DEV
  ? '' // Relative URL for proxy
  : (import.meta.env.VITE_API_URL || 'http://localhost:8090');

export const authClient = createClient({
  clientID: 'kubegram-ui',
  issuer: oauthBaseUrl
    ? `${oauthBaseUrl}/oauth`
    : '/oauth', // Relative path for dev proxy
});

export const CALLBACK_URL = `${window.location.origin}/oauth/callback`;
