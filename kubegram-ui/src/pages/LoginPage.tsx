import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Github, Chrome, Gitlab, Shield, Mail, MessageSquare, Key, Lock } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { initiateLogin } from '../store/slices/oauth/oauthThunks';
import { selectAvailableProviders } from '../store/slices/oauth/oauthSlice';
import type { OAuthProvider } from '../store/slices/oauth/types';

// Hardcoded provider configurations with proper typing
const hardcodedProviders: { id: OAuthProvider; name: string; icon: React.ElementType; description: string }[] = [
  { id: 'github', name: 'GitHub', icon: Github, description: 'Sign in with your GitHub account' },
  { id: 'google', name: 'Google', icon: Chrome, description: 'Sign in with your Google account' },
  { id: 'gmail', name: 'Gmail', icon: Mail, description: 'Sign in with your Gmail account' },
  { id: 'slack', name: 'Slack', icon: MessageSquare, description: 'Sign in with your Slack workspace' },
  { id: 'gitlab', name: 'GitLab', icon: Gitlab, description: 'Sign in with your GitLab account' },
  { id: 'okta', name: 'Okta', icon: Shield, description: 'Sign in with your Okta account' },
  { id: 'oidc', name: 'OIDC', icon: Key, description: 'Sign in with OpenID Connect' },
  { id: 'sso', name: 'SSO', icon: Shield, description: 'Sign in with Single Sign-On' },
  { id: 'password', name: 'Email & Password', icon: Lock, description: 'Sign in with email and password' },
];

// Default providers to show when backend list is not loaded
const defaultProviders = hardcodedProviders.filter(p => p.id !== 'password');

interface LoginButtonProps {
  provider: {
    id: OAuthProvider;
    name: string;
    icon: React.ElementType;
    description: string;
  };
  onClick: () => void;
}

const LoginButton: React.FC<LoginButtonProps> = ({ provider, onClick }) => {
  const Icon = provider.icon;
  
  return (
    <Button
      onClick={onClick}
      className="w-full flex items-center justify-center space-x-2 h-12"
      variant="outline"
    >
      <Icon className="h-5 w-5" />
      <span>Continue with {provider.name}</span>
    </Button>
  );
};

const LoginPage = () => {
  const dispatch = useDispatch();
  const availableProviders = useSelector(selectAvailableProviders);

  // Check if password provider is available (IS_SELF_SERVE=true on backend)
  const passwordProvider = availableProviders.find(p => p.id === 'password');
  const hasPasswordProvider = !!passwordProvider;

  // Use dynamic providers from backend, fall back to hardcoded list if not loaded
  const providersToShow = availableProviders.length > 0
    ? availableProviders.filter(p => p.id !== 'password')
    : defaultProviders;

  const handleLogin = (provider: OAuthProvider) => {
    dispatch(initiateLogin(provider) as any);
  };

  // Handle password login
  const handlePasswordLogin = () => {
    dispatch(initiateLogin('password') as any);
  };

  // Handle registration
  const handleRegister = () => {
    if (passwordProvider?.registerUrl) {
      window.location.href = passwordProvider.registerUrl;
    } else {
      // Use relative URL in development to leverage Vite proxy (avoids CORS)
      // Use full URL in production
      const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8090');
      window.location.href = `${baseUrl}/oauth/password/register`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to KubeGram
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose your preferred authentication method sdfdmfdlfmdgl
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {providersToShow.map((provider) => {
              // Find hardcoded config for icon and description
              const hardcoded = hardcodedProviders.find(p => p.id === provider.id);
              const providerWithMeta = {
                ...provider,
                icon: hardcoded?.icon || Key,
                description: hardcoded?.description || `Sign in with ${provider.name}`
              };

              return (
                <LoginButton
                  key={provider.id}
                  provider={providerWithMeta}
                  onClick={() => handleLogin(provider.id)}
                />
              );
            })}

            {/* Password Login Section - shown when password provider is available */}
            {hasPasswordProvider && (
              <>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">or</span>
                  </div>
                </div>

                <Button
                  onClick={handlePasswordLogin}
                  className="w-full flex items-center justify-center space-x-2 h-12"
                  variant="outline"
                >
                  <Lock className="h-5 w-5" />
                  <span>Continue with Email & Password</span>
                </Button>

                <button
                  onClick={handleRegister}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Create an account
                </button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-600">
          <p>
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;