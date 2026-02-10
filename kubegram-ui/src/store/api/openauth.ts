import { createClient } from "@openauthjs/openauth/client";

// Get the API URL from environment or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090';

// Create OpenAuth client configuration
export const openAuthClient = createClient({
  clientID: "kubegram-web",
  issuer: `${API_URL}/oauth`,
});

// Export convenience methods for OAuth operations
export const openAuthApi = {
  /**
   * Initiate OAuth login for a specific provider
   */
  async initiateLogin(provider: string, callbackUrl: string) {
    try {
      const result = await openAuthClient.authorize(callbackUrl, "code");

      if (result.url) {
        // Redirect to OAuth provider
        window.location.href = result.url;
      }

      return result;
    } catch (error: any) {
      throw new Error(`Failed to initiate ${provider} login: ${error.message || 'Unknown error'}`);
    }
  },

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(callbackUrl: string, code: string) {
    try {
      // For OpenAuth, we need to use PKCE verifier from localStorage
      const challenge = JSON.parse(localStorage.getItem("challenge") || "{}");
      const exchanged = await openAuthClient.exchange(code, callbackUrl, challenge.verifier);

      if (exchanged.err) {
        throw new Error(`Failed to exchange code: ${exchanged.err.message}`);
      }

      const tokens = exchanged.tokens;
      if (!tokens) {
        throw new Error('No tokens received from exchange');
      }

      return {
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer'
      };
    } catch (error: any) {
      throw new Error(`Failed to exchange code for tokens: ${error.message || 'Unknown error'}`);
    }
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string) {
    try {
      const result = await openAuthClient.refresh(refreshToken);

      if (result.err) {
        throw new Error(`Failed to refresh token: ${result.err.message}`);
      }

      const tokens = result.tokens;
      if (!tokens) {
        throw new Error('No tokens received from refresh');
      }

      return {
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer'
      };
    } catch (error: any) {
      throw new Error(`Failed to refresh access token: ${error.message || 'Unknown error'}`);
    }
  },

  /**
   * Revoke token (logout)
   */
  async revokeToken(token: string) {
    try {
      // OpenAuth doesn't have a direct revoke method, so we'll handle this
      // through our backend logout endpoint
      await fetch(`${API_URL}/api/v1/public/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token })
      });
    } catch (error: any) {
      // Even if logout fails on backend, we should clear local state
      console.warn('Logout request failed:', error);
      throw new Error(`Failed to logout: ${error.message || 'Unknown error'}`);
    }
  }
};

export default openAuthClient;