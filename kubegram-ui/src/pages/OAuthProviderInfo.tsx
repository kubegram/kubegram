import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const OAuthProviderInfo: React.FC = () => {
  const providers = [
    {
      id: 'github',
      name: 'GitHub',
      description: 'Version control and collaboration platform',
      useCase: 'Perfect for developer workflows, repository access',
      icon: '🐙'
    },
    {
      id: 'google',
      name: 'Google',
      description: 'Google identity and access management',
      useCase: 'General authentication with Google accounts',
      icon: '🔍'
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Gmail API access with email and profile',
      useCase: 'Email management and Gmail integration',
      icon: '📧'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Slack workspace access and messaging',
      useCase: 'Team collaboration and communication',
      icon: '💬'
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      description: 'GitLab CI/CD and repository management',
      useCase: 'DevOps pipelines and project management',
      icon: '🦊'
    },
    {
      id: 'okta',
      name: 'Okta',
      description: 'Enterprise identity and access management',
      useCase: 'Corporate SSO and directory integration',
      icon: '🛡️'
    },
    {
      id: 'oidc',
      name: 'OIDC',
      description: 'OpenID Connect standard authentication',
      useCase: 'Custom identity providers and federation',
      icon: '🔑'
    },
    {
      id: 'sso',
      name: 'SSO',
      description: 'Single Sign-On integration',
      useCase: 'Enterprise authentication and access control',
      icon: '🏢'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Supported OAuth Providers
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            KubeGram supports multiple authentication providers to fit your organization's needs. 
            Choose the provider that best matches your workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <Card key={provider.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{provider.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {provider.id.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700">Description</h4>
                    <p className="text-sm text-gray-600">{provider.description}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700">Best For</h4>
                    <p className="text-sm text-gray-600">{provider.useCase}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Provider Configuration</h2>
          <p className="text-blue-800 mb-4">
            Each provider requires specific configuration in your OAuth backend. Make sure to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-blue-800">
            <li>Register your application with each provider</li>
            <li>Configure redirect URLs to match your callback endpoint</li>
            <li>Set appropriate scopes for required permissions</li>
            <li>Store client secrets securely in your backend</li>
            <li>Test the complete OAuth flow before production</li>
          </ul>
          <div className="mt-6">
            <a 
              href="/login" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Try OAuth Login →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthProviderInfo;