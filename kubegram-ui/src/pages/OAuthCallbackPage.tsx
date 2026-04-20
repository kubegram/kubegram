import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { authClient, CALLBACK_URL } from '@/lib/auth/client';
import { setTokens } from '@/store/slices/oauth/oauthSlice';
import { checkAuthStatus } from '@/store/slices/oauth/oauthThunks';
import type { AppDispatch } from '@/store';

export default function OAuthCallbackPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    async function exchange() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (!code) {
        navigate('/');
        return;
      }

      try {
        const stored = sessionStorage.getItem('pkce_challenge');
        const challenge = stored ? JSON.parse(stored) : {};

        const exchanged = await authClient.exchange(code, CALLBACK_URL, challenge.verifier);
        if (exchanged.err) throw new Error('Token exchange failed');

        sessionStorage.removeItem('pkce_challenge');
        sessionStorage.setItem('access_token', exchanged.tokens.access);
        sessionStorage.setItem('refresh_token', exchanged.tokens.refresh);

        dispatch(setTokens({
          accessToken: exchanged.tokens.access,
          refreshToken: exchanged.tokens.refresh,
        }));

        await dispatch(checkAuthStatus());

        const redirectTo = localStorage.getItem('oauth_redirect_path') || '/';
        localStorage.removeItem('oauth_redirect_path');
        navigate(redirectTo);
      } catch (err) {
        console.error('OAuth callback failed', err);
        navigate('/');
      }
    }

    exchange();
  }, []);

  return <div className="flex h-screen items-center justify-center text-gray-400">Completing sign in…</div>;
}
