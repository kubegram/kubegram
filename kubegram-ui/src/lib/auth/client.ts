import { createClient } from '@openauthjs/openauth/client';

// Use backend URL directly - auth client needs absolute URL for discovery
// The authorize() call returns a full backend URL which the browser navigates to directly
const oauthBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8090';

export const authClient = createClient({
  clientID: 'kubegram-ui',
  issuer: `${oauthBaseUrl}/oauth`,
});

export const CALLBACK_URL = `${window.location.origin}/oauth/callback`;
