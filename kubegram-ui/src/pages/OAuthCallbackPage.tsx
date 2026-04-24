import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (error) {
      console.error('OAuth error from provider:', error, params.get('error_description'));
      navigate('/');
      return;
    }

    navigate('/app');
  }, []);

  return <div className="flex h-screen items-center justify-center text-gray-400">Completing sign in…</div>;
}