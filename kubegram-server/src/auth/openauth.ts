import { createAuthApp, GithubProvider, GoogleProvider, createMemoryStorage, createLruRedisStorage } from '@kubegram/kubegram-auth';
import config from '../config/env';
import { db } from '@/db';
import { users, companies, organizations, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';
import logger from '../utils/logger';
import { randomUUID } from 'crypto';
import { redisClient } from '../state/redis';

async function ensureUserHasTeam(userId: number, userName: string): Promise<{ teamId: number, organizationId: number, companyId: string }> {
  try {
    const existingUsers = await db!.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUsers.length === 0) {
      throw new Error('User not found');
    }

    const user = existingUsers[0];

    if (user.teamId) {
      const teamResult = await db!.select()
        .from(teams)
        .where(eq(teams.id, user.teamId))
        .limit(1);

      if (teamResult.length === 0) {
        throw new Error('Team not found for user');
      }

      const team = teamResult[0];

      if (!team.organizationId) {
        throw new Error('Team has no associated organization');
      }

      const orgResult = await db!.select()
        .from(organizations)
        .where(eq(organizations.id, team.organizationId))
        .limit(1);

      if (orgResult.length === 0) {
        throw new Error('Organization not found for team');
      }

      const organization = orgResult[0];

      if (!organization.companyId) {
        throw new Error('Organization has no associated company');
      }

      const companyResult = await db!.select()
        .from(companies)
        .where(eq(companies.id, organization.companyId))
        .limit(1);

      if (companyResult.length === 0) {
        throw new Error('Company not found for organization');
      }

      const company = companyResult[0];

      return {
        teamId: team.id,
        organizationId: organization.id,
        companyId: company.id
      };
    }

    const uuid = randomUUID();
    const sanitizedUserName = userName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

    const newCompanyResult = await db!.insert(companies)
      .values({
        name: `company-${sanitizedUserName}-${uuid}`
      })
      .returning({ id: companies.id, name: companies.name });

    const companyId = newCompanyResult[0].id;
    logger.info('Created placeholder company', { companyId, userId });

    const newOrgResult = await db!.insert(organizations)
      .values({
        name: `org-${sanitizedUserName}-${uuid}`,
        companyId: companyId
      })
      .returning({ id: organizations.id, name: organizations.name });

    const organizationId = newOrgResult[0].id;
    logger.info('Created placeholder organization', { organizationId, companyId, userId });

    const newTeamResult = await db!.insert(teams)
      .values({
        name: `team-${sanitizedUserName}-${uuid}`,
        organizationId: organizationId
      })
      .returning({ id: teams.id, name: teams.name });

    const teamId = newTeamResult[0].id;
    logger.info('Created placeholder team', { teamId, organizationId, userId });

    await db!.update(users)
      .set({
        teamId: teamId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    logger.info('Updated user with team assignment', { userId, teamId });

    return {
      teamId,
      organizationId,
      companyId
    };
  } catch (error) {
    logger.error('Failed to ensure user has team', { userId, userName, error });
    throw new Error(`Failed to ensure user team assignment: ${(error as Error).message}`);
  }
}

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

const redis = redisClient.getClient();
const storage = config.enableHA
  ? createLruRedisStorage({ redis: redis as any })
  : createMemoryStorage();

logger.info('OpenAuth storage backend', { mode: config.enableHA ? 'redis+lru' : 'memory' });

const app = createAuthApp({
  subjects,
  providers,
  storage: storage as any,
  select: async (options, req) => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { ProviderSelect } = await import('./ui');

    const url = new URL(req.url);
    const basePath = url.pathname.replace(/\/authorize$/, '');

    const configuredProviders = Object.keys(providers).map(p => {
      const name = p.charAt(0).toUpperCase() + p.slice(1);
      return { id: p, name };
    });

    const extraProviders = [
      { id: 'slack', name: 'Slack' },
      { id: 'gitlab', name: 'GitLab' },
      { id: 'discord', name: 'Discord' },
      { id: 'okta', name: 'Okta' },
      { id: 'sso', name: 'SSO' }
    ];

    const availableProviders = [
      ...configuredProviders,
      ...extraProviders.filter(ep => !configuredProviders.find(cp => cp.id === ep.id))
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

export default app;
