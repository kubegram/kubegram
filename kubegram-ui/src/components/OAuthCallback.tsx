import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { handleCallback, fetchUserContext } from '../store/slices/oauth/oauthThunks';
import { setUser } from '../store/slices/oauth/oauthSlice';
import { fetchCurrentUser } from '@/store/api/userApi';
import type { User } from '@/store/slices/oauth/types';
import type { RootState } from '../store';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2 } from 'lucide-react';

const OAuthCallback = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { error, isAuthenticated } = useSelector((state: RootState) => state.oauth);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const provider = searchParams.get('provider') || 'github'; // Default to github

    const processLogin = async () => {
      if (code && state) {
        // OpenAuth requires both code and state parameters
        const resultAction = await dispatch(handleCallback({ provider, code, state }) as any);

        // If authentication succeeded, fetch user context
        if (handleCallback.fulfilled.match(resultAction)) {
          let user: User | undefined = resultAction.payload.user as unknown as User;
          const accessToken = resultAction.payload.accessToken;

          // If user ID is missing, try to fetch current user profile
          if ((!user || !user.id) && accessToken) {
            try {
              const fetchedUser = await fetchCurrentUser(accessToken);
              if (fetchedUser) {
                user = fetchedUser;
                // Update user in Redux state
                dispatch(setUser(fetchedUser));
              }
            } catch (err) {
              console.error('Failed to fetch current user:', err);
            }
          }

          if (user?.id && accessToken) {
            // Fetch team, organization, and company in cascade
            await dispatch(fetchUserContext({ userId: user.id, accessToken }) as any);
          }
        }
      } else {
        // Missing required parameters, redirect to login (which will now show modal)
        navigate('/login');
      }
    };

    processLogin();
  }, [dispatch, searchParams, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to stored path or home page after successful auth
      const redirectPath = localStorage.getItem('oauth_redirect_path');
      if (redirectPath) {
        localStorage.removeItem('oauth_redirect_path');
        navigate(redirectPath);
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Authentication Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center space-y-4 pt-6">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Completing authentication...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthCallback;