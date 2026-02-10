import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Github, Chrome, Gitlab, Shield, Mail, MessageSquare, Key } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { initiateLogin } from '../store/slices/oauth/oauthThunks';
import type { OAuthProvider } from '../store/slices/oauth/types';

const providers = [
  {
    id: 'github' as OAuthProvider,
    name: 'GitHub',
    icon: Github,
    description: 'Sign in with your GitHub account'
  },
  {
    id: 'google' as OAuthProvider,
    name: 'Google',
    icon: Chrome,
    description: 'Sign in with your Google account'
  },
  {
    id: 'gmail' as OAuthProvider,
    name: 'Gmail',
    icon: Mail,
    description: 'Sign in with your Gmail account'
  },
  {
    id: 'slack' as OAuthProvider,
    name: 'Slack',
    icon: MessageSquare,
    description: 'Sign in with your Slack workspace'
  },
  {
    id: 'gitlab' as OAuthProvider,
    name: 'GitLab',
    icon: Gitlab,
    description: 'Sign in with your GitLab account'
  },
  {
    id: 'okta' as OAuthProvider,
    name: 'Okta',
    icon: Shield,
    description: 'Sign in with your Okta account'
  },
  {
    id: 'oidc' as OAuthProvider,
    name: 'OIDC',
    icon: Key,
    description: 'Sign in with OpenID Connect'
  },
  {
    id: 'sso' as OAuthProvider,
    name: 'SSO',
    icon: Shield,
    description: 'Sign in with Single Sign-On'
  }
];

interface LoginButtonProps {
  provider: typeof providers[0];
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

  const handleLogin = (provider: OAuthProvider) => {
    dispatch(initiateLogin(provider) as any);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to KubeGram
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose your preferred authentication method
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {providers.map((provider) => (
              <LoginButton
                key={provider.id}
                provider={provider}
                onClick={() => handleLogin(provider.id)}
              />
            ))}
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