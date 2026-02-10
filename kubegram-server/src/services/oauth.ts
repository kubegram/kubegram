

interface OAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    authUrl: string;
    tokenUrl: string;
    userUrl: string;
    scope: string;
}

const envConfigs: Record<string, Function> = {
    github: () => ({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        redirectUri: `${process.env.APP_URL || 'http://localhost:3000'}/api/public/v1/auth/github/callback`,
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userUrl: 'https://api.github.com/user',
        scope: 'user:email read:user',
    }),
    google: () => ({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: `${process.env.APP_URL || 'http://localhost:3000'}/api/public/v1/auth/google/callback`,
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scope: 'email profile',
    }),
    gitlab: () => ({
        clientId: process.env.GITLAB_CLIENT_ID,
        clientSecret: process.env.GITLAB_CLIENT_SECRET,
        redirectUri: `${process.env.APP_URL || 'http://localhost:3000'}/api/public/v1/auth/gitlab/callback`,
        authUrl: 'https://gitlab.com/oauth/authorize',
        tokenUrl: 'https://gitlab.com/oauth/token',
        userUrl: 'https://gitlab.com/api/v4/user',
        scope: 'read_user',
    }),
    okta: () => ({
        clientId: process.env.OKTA_CLIENT_ID,
        clientSecret: process.env.OKTA_CLIENT_SECRET,
        redirectUri: `${process.env.APP_URL || 'http://localhost:3000'}/api/public/v1/auth/okta/callback`,
        authUrl: `https://${process.env.OKTA_DOMAIN}/oauth2/v1/authorize`,
        tokenUrl: `https://${process.env.OKTA_DOMAIN}/oauth2/v1/token`,
        userUrl: `https://${process.env.OKTA_DOMAIN}/oauth2/v1/userinfo`,
        scope: 'openid profile email',
    }),
    sso: () => ({ // Generic SSO / Custom Provider example
        clientId: process.env.SSO_CLIENT_ID,
        clientSecret: process.env.SSO_CLIENT_SECRET,
        redirectUri: `${process.env.APP_URL || 'http://localhost:3000'}/api/public/v1/auth/sso/callback`,
        authUrl: process.env.SSO_AUTH_URL,
        tokenUrl: process.env.SSO_TOKEN_URL,
        userUrl: process.env.SSO_USER_URL,
        scope: 'openid email',
    })
};

async function getConfig(provider: string): Promise<OAuthConfig | null> {
    const configFn = envConfigs[provider];
    if (configFn) {
        return configFn();
    }
    return null;
}

export async function getAuthorizationUrl(provider: string): Promise<string | null> {
    const config = await getConfig(provider);

    // Check if essential config is missing
    if (!config || !config.clientId || !config.authUrl) return null;

    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: config.scope,
        state: Math.random().toString(36).substring(7), // In production use proper state generation and storage
    });

    return `${config.authUrl}?${params.toString()}`;
}

export async function exchangeCodeForToken(provider: string, code: string): Promise<any | null> {
    const config = await getConfig(provider);
    if (!config) return null;

    const body: any = {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri, // Some providers require this to match auth request
        grant_type: 'authorization_code',
    };

    try {
        const response = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        if (data.error) {
            console.error('Token exchange error:', data);
            return null;
        }
        return data.access_token;
    } catch (e) {
        console.error('Token exchange failed:', e);
        return null;
    }
}

export async function getUserProfile(provider: string, accessToken: string): Promise<any | null> {
    const config = await getConfig(provider);
    if (!config) return null;

    try {
        const response = await fetch(config.userUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
        });

        return await response.json();
    } catch (e) {
        console.error('Fetch user profile failed:', e);
        return null;
    }
}
