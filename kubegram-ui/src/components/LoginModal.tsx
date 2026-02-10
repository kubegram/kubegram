import React from 'react';
import { Button } from '@/components/ui/button';
import { Github, Chrome, Gitlab, Key, LogIn } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { initiateLogin } from '../store/slices/oauth/oauthThunks';
import type { OAuthProvider } from '../store/slices/oauth/types';

/**
 * KUBEGRAM Logo Component
 */
const KubegramLogo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <img
      src="/logo.png"
      alt="KUBEGRAM"
      className="h-28 w-auto"
    />
  </div>
);

/**
 * LoginModal Component Props
 */
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
}

/**
 * OAuth Provider Configuration
 */
const mainProviders = [
  {
    id: 'github' as OAuthProvider,
    name: 'Continue with GitHub',
    icon: Github,
    svgPath: '/github.svg'
  },
  {
    id: 'google' as OAuthProvider,
    name: 'Continue with Google',
    icon: Chrome,
    svgPath: '/google.svg'
  },

];

const otherProviders = [
  {
    id: 'gitlab' as OAuthProvider,
    name: 'GitLab',
    icon: Gitlab,
    svgPath: '/gitlab.svg'
  },
  {
    id: 'slack' as OAuthProvider,
    name: 'Slack',
    icon: `<svg height="20" width="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>`,
  },
  {
    id: 'okta' as OAuthProvider,
    name: 'Okta',
    icon: `<svg height="20" width="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/></svg>`,
  },
  {
    id: 'oidc' as OAuthProvider,
    name: 'OIDC',
    icon: Key
  },
  {
    id: 'discord' as OAuthProvider,
    name: 'Discord',
    icon: `<svg height="20" width="20" viewBox="0 0 24 24" fill="currentColor" style="color:#5865F2"><path d="M20.211 2.373a6.865 6.865 0 00-5.834 2.825 19.394 19.394 0 00-1.874 0 6.865 6.865 0 00-5.834-2.825c-3.003.011-5.746 2.08-6.19 5.093-.733 5.074 2.062 9.479 6.25 11.233 1.258.529 2.193.921 3.012 1.285.459.197.94.398 1.439.599.309.125.626.252.951.378.077.03-.198-.094-.12-.12a.669.669 0 00.12 0c.325-.126.642-.253.951-.378.499-.201.98-.402 1.439-.599.819-.364 1.754-.756 3.012-1.285 4.188-1.754 6.983-6.159 6.25-11.233-.444-3.013-3.187-5.082-6.19-5.093zM8.882 15.658c-1.373 0-2.5-1.121-2.5-2.5 0-1.379 1.127-2.5 2.5-2.5s2.5 1.121 2.5 2.5c.001 1.379-1.126 2.5-2.5 2.5zm6.236 0c-1.373 0-2.5-1.121-2.5-2.5 0-1.379 1.127-2.5 2.5-2.5s2.5 1.121 2.5 2.5c.001 1.379-1.126 2.5-2.5 2.5z"/></svg>`,
  },
  {
    id: 'sso' as OAuthProvider,
    name: 'SSO',
    icon: `<svg height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`
  }
];

/**
 * LoginModal Component
 *
 * A modal component for OAuth authentication with:
 * - 3 main OAuth providers (GitHub, Google, Slack)
 * - Dropdown menu for other providers (Gmail, GitLab, Okta, OIDC, SSO)
 * - Dark themed design matching app aesthetic
 */
const LoginModal: React.FC<LoginModalProps> = ({ isOpen, isLoading }) => {
  const dispatch = useDispatch();

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    try {
      await dispatch(initiateLogin(provider) as any);
    } catch (error: any) {
      console.error(`OAuth login failed for ${provider}:`, error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with unified gradient background */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(42, 42, 42, 0.95) 0%, rgba(37, 37, 37, 0.95) 50%, rgba(32, 32, 32, 0.95) 100%)'
        }}
      >
        {/* Dot pattern background */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle, #6a6a6a 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      {/* Modal */}
      <div className="relative rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8" style={{
        background: 'linear-gradient(135deg, #2a2a2aff 0%, #252525ff 50%, #202020ff 100%)'
      }}>

        {/* KUBEGRAM Logo */}
        <div className="flex justify-center mb-6 mt-16">
          <KubegramLogo />
        </div>

        <p className="text-center text-gray-400 mb-8 max-w-xs mx-auto">
          Please sign in to access your Kubernetes clusters and manage your infrastructure.
        </p>

        {/* Provider Icons Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6 px-2">
          {[...mainProviders, ...otherProviders].map((provider) => {
            const Icon = provider.icon;
            return (
              <div
                key={provider.id}
                className="flex flex-col items-center justify-center space-y-2 group"
                title={provider.name}
              >
                <div className="p-3 rounded-full bg-gray-800 border border-gray-700 group-hover:border-gray-500 group-hover:bg-gray-700 transition-all duration-200">
                  {provider.svgPath ? (
                    <img src={provider.svgPath} alt={provider.name} className="h-6 w-6 opacity-70 group-hover:opacity-100 transition-opacity" />
                  ) : typeof Icon === 'string' ? (
                    <div
                      className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: Icon }}
                    />
                  ) : (
                    <Icon className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Single Login Button */}
        <Button
          onClick={() => handleOAuthLogin('oidc')}
          className="w-full flex items-center justify-center space-x-3 h-12 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200"
          disabled={isLoading}
        >
          <LogIn className="h-5 w-5" />
          <span>Login or Sign up</span>
        </Button>

        {/* Error message placeholder */}
        {isLoading && (
          <div className="mt-4 text-center text-sm text-gray-400">
            Connecting to authentication service...
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
