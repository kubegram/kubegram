import { optionalAuth, deleteSession } from '@/middleware/auth';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import config from "@/config/env";

const app = new Hono();

// Get current user session
app.get('/me', async (c) => {
  const auth = await optionalAuth(c);

  if (!auth) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  return c.json({
    id: auth.user.id,
    email: auth.user.email,
    name: auth.user.name,
    avatar: auth.user.avatar,
    role: auth.user.role,
    teamId: auth.user.teamId
  });
});

// Logout
app.post('/logout', async (c) => {
  const sessionCookie = getCookie(c, "session");

  if (sessionCookie) {
    try {
      await deleteSession(sessionCookie);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  // Clear the session cookie using Hono's cookie functionality
  return c.json({ message: 'Logged out successfully' }, 200, {
    'Set-Cookie': 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
  });
});

// Get available OAuth providers
app.get('/providers', (c) => {
  const providers = [];

  if (config.githubClientId && config.githubClientSecret) {
    providers.push({
      id: 'github',
      name: 'GitHub',
      authUrl: `${config.appUrl}/oauth/github`
    });
  }

  if (config.googleClientId && config.googleClientSecret) {
    providers.push({
      id: 'google',
      name: 'Google',
      authUrl: `${config.appUrl}/oauth/google`
    });
  }

  if (config.gitlabClientId && config.gitlabClientSecret) {
    providers.push({
      id: 'gitlab',
      name: 'GitLab',
      authUrl: `${config.appUrl}/oauth/gitlab`
    });
  }

  return c.json({ providers });
});

export default app;
