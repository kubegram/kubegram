import { issuer, GithubProvider, GoogleProvider, createMemoryStorage, createLruRedisStorage } from '@kubegram/kubegram-auth';
import { PasswordProvider } from '@openauthjs/openauth/provider/password';
import { PasswordUI } from '@openauthjs/openauth/ui/password';
import config from '../config/env';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';
import logger from '../utils/logger';
import { redisClient } from '../state/redis';
import { getRepositories } from '@/repositories';
import { ensureUserHasTeam } from '@/services/user-hierarchy';

const subjects = {
  user: v.object({
    id: v.string(),
    provider: v.string(),
  })
};

const providers: Record<string, any> = {};

if (config.githubClientId && config.githubClientSecret) {
  providers.github = GithubProvider({
    clientID: config.githubClientId,
    clientSecret: config.githubClientSecret,
    scopes: ['user:email', 'read:user'],
  });
  logger.info('Loaded github provider from environment');
}

if (config.googleClientId && config.googleClientSecret) {
  providers.google = GoogleProvider({
    clientID: config.googleClientId,
    clientSecret: config.googleClientSecret,
    scopes: ['email', 'profile'],
  });
  logger.info('Loaded google provider from environment');
}

if (config.isSelfServe) {
  providers.password = PasswordProvider(
    PasswordUI({
      sendCode: async (email: string, code: string) => {
        logger.warn('SELF-SERVE EMAIL VERIFICATION CODE', { email, code });
      },
      validatePassword: (password: string) => {
        if (password.length < 8) return 'Password must be at least 8 characters';
        return undefined;
      },
    })
  );
  logger.info('Loaded password provider (IS_SELF_SERVE=true)');
}

const redis = redisClient.getClient();
const storage = config.enableHA
  ? createLruRedisStorage({ redis: redis as any })
  : createMemoryStorage();

logger.info('OpenAuth storage backend', { mode: config.enableHA ? 'redis+lru' : 'memory' });

const issuerApp = issuer({
  subjects,
  providers,
  storage: storage as any,
  select: async (options, req) => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { ProviderSelect } = await import('./ui');

    // Hardcoded because URL rewriting strips /oauth before OpenAuth sees req.url,
    // so dynamic extraction would yield "" instead of "/oauth".
    const basePath = '/oauth';

    const nameOverrides: Record<string, string> = {
      password: 'Email & Password'
    };
    const configuredProviders = Object.keys(providers).map(p => ({
      id: p,
      name: nameOverrides[p] || (p.charAt(0).toUpperCase() + p.slice(1))
    }));

    const extraProviders = [
      { id: 'slack', name: 'Slack' },
      { id: 'gitlab', name: 'GitLab' },
      { id: 'discord', name: 'Discord' },
      { id: 'okta', name: 'Okta' },
      { id: 'sso', name: 'SSO' }
    ];

    const availableProviders = [
      ...configuredProviders,
      ...(config.isSelfServe ? [] : extraProviders.filter(ep => !configuredProviders.find(cp => cp.id === ep.id)))
    ];

    const element = React.createElement(ProviderSelect, {
      providers: availableProviders,
      basePath: basePath,
      logoUrl: "/logo.png"
    });

    const html = renderToStaticMarkup(element);

    return new Response(`<!DOCTYPE html>${html}`, {
      headers: { "Content-Type": "text/html" }
    });
  },
  success: async (ctx, value) => {
    logger.debug('OAuth success', { provider: value.provider, value: JSON.stringify(value, null, 2) });

    try {
      // Handle password provider — no tokenset, just email
      if (value.provider === 'password') {
        const email = (value as any).email as string;
        if (!email) throw new Error('Password provider did not return email');

        const repos = getRepositories();
        const existingUser = await repos.users.findOne({ where: { email } });
        let userId: number;
        let userName: string;

        if (existingUser) {
          userId = existingUser.id;
          userName = existingUser.name;
          await repos.users.update(userId, { provider: 'password', updatedAt: new Date() });
          logger.info('Password login: existing user', { email, userId });
        } else {
          userName = email.split('@')[0];
          const newUser = await repos.users.create({ name: userName, email, provider: 'password', providerId: email, role: 'team_member' });
          userId = newUser.id;
          logger.info('Password register: created user', { email, userId });
        }

        const userHierarchy = await ensureUserHasTeam(userId, userName);
        const response = await ctx.subject('user', { id: userId.toString(), provider: 'password' });
        response.headers.set('X-Kubegram-Company-Id', userHierarchy.companyId);
        response.headers.set('X-Kubegram-Organization-Id', userHierarchy.organizationId.toString());
        response.headers.set('X-Kubegram-Team-Id', userHierarchy.teamId.toString());
        return response;
      }

      let email = '';
      let name = '';
      let avatarUrl = '';
      let providerId = '';

      const hasTokenset = (v: any): v is { provider: string; tokenset: { access: string } } => {
        return 'tokenset' in v && 'access' in v.tokenset;
      };

      if (!hasTokenset(value)) {
        throw new Error('OAuth response missing tokenset');
      }

      if (value.provider === 'google') {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${value.tokenset.access}`
          }
        });
        const userInfo = await userInfoResponse.json();
        email = userInfo.email;
        name = userInfo.name || email.split('@')[0];
        avatarUrl = userInfo.picture || '';
        providerId = userInfo.id;
      } else if (value.provider === 'github') {
        const userInfoResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${value.tokenset.access}`,
            'User-Agent': 'Kubegram'
          }
        });
        const userInfo = await userInfoResponse.json();

        const emailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `Bearer ${value.tokenset.access}`,
            'User-Agent': 'Kubegram'
          }
        });
        const emails = await emailResponse.json();
        const primaryEmail = emails.find((e: any) => e.primary) || emails[0];

        email = primaryEmail.email;
        name = userInfo.name || userInfo.login;
        avatarUrl = userInfo.avatar_url || '';
        providerId = userInfo.id.toString();
      }

      if (!email) {
        throw new Error('Could not get email from OAuth provider');
      }

      const existingUsers = await db!.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      let userId: number;

      if (existingUsers.length > 0) {
        const user = existingUsers[0];
        userId = user.id;

        await db!.update(users)
          .set({
            name,
            avatarUrl,
            provider: value.provider,
            providerId,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        try {
          await ensureUserHasTeam(userId, name);
        } catch (teamError) {
          logger.error('Failed to ensure team assignment for existing user', { userId, teamError });
          throw teamError;
        }

        logger.info('Updated existing user', { email, userId });
      } else {
        const newUserResult = await db!.insert(users)
          .values({
            name,
            email,
            avatarUrl,
            provider: value.provider,
            providerId,
            role: 'team_member'
          })
          .returning({ id: users.id });

        userId = newUserResult[0].id;
        logger.info('Created new user', { email, userId });

        try {
          await ensureUserHasTeam(userId, name);
        } catch (teamError) {
          logger.error('Failed to ensure team assignment for new user', { userId, teamError });
          throw teamError;
        }
      }

      let userHierarchy;
      try {
        userHierarchy = await ensureUserHasTeam(userId, name);
      } catch (hierarchyError) {
        logger.error('Failed to get user hierarchy for response headers', { userId, hierarchyError });
        throw hierarchyError;
      }

      logger.debug('Creating subject', { userId, providerId, provider: value.provider });

      const response = await ctx.subject('user', {
        id: userId.toString(),
        provider: value.provider
      });

      response.headers.set('X-Kubegram-Company-Id', userHierarchy.companyId);
      response.headers.set('X-Kubegram-Organization-Id', userHierarchy.organizationId.toString());
      response.headers.set('X-Kubegram-Team-Id', userHierarchy.teamId.toString());

      return response;
    } catch (error) {
      logger.error('OAuth success callback error', { error });
      throw error;
    }
  },
  error: async (error) => {
    logger.error('OAuth error', { error });
    throw error;
  },
});

export interface UserSubject {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  teamId?: number;
}

export default {
  handle: (issuerApp as any).fetch.bind(issuerApp),
  hono: issuerApp,
};
