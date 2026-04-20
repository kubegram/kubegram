import { optionalAuth, deleteSession, storeSession } from '@/middleware/auth';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import config from "@/config/env";
import { authConfig } from "@/config/authConfig";
import { privateDecrypt, constants, randomUUID } from 'crypto';
import { getRepositories } from '@/repositories';
import { createChallenge, resolveChallenge } from '@/services/mfa-challenge';
import { verifyTotpCode } from '@/services/mfa';
import { ensureUserHasTeam } from '@/services/user-hierarchy';
import logger from '@/utils/logger';

const SESSION_TTL = 86400; // 24 hours in seconds

function decryptPassword(encryptedBase64: string): string {
  if (!authConfig.privateKeyPem) throw new Error('Encryption not configured');
  const decrypted = privateDecrypt(
    { key: authConfig.privateKeyPem, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    Buffer.from(encryptedBase64, 'base64')
  );
  return decrypted.toString('utf8');
}

const app = new Hono();

// Get current user session
app.get('/me', async (c) => {
  const auth = await optionalAuth(c);

  if (!auth) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  return c.json({
    user: {
      id: auth.user.id,
      email: auth.user.email,
      name: auth.user.name,
      avatar: auth.user.avatar,
      role: auth.user.role,
      teamId: auth.user.teamId,
    }
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

  if (config.isSelfServe) {
    providers.push({
      id: 'password',
      name: 'Email & Password',
      authUrl: `${config.appUrl}/oauth/password/authorize`,
      registerUrl: `${config.appUrl}/oauth/password/register`,
    });
  }

  return c.json({ providers });
});

// Return encryption config so the UI knows whether to encrypt passwords
app.get('/encryption-config', (c) => {
  return c.json({
    encryptionEnabled: authConfig.encryptionEnabled,
    publicKeyPem: authConfig.encryptionEnabled ? authConfig.publicKeyPem : null,
  });
});

// Custom password login — validates bcrypt hash, creates a session cookie
app.post('/password/login', async (c) => {
  if (!config.isSelfServe) {
    return c.json({ error: 'Password auth not enabled' }, 403);
  }

  let body: { email?: string; password?: string; encryptedPassword?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const { email, password, encryptedPassword } = body;
  if (!email || (!password && !encryptedPassword)) {
    return c.json({ error: 'email and password are required' }, 400);
  }

  let plainPassword: string;
  try {
    plainPassword = authConfig.encryptionEnabled && encryptedPassword
      ? decryptPassword(encryptedPassword)
      : (password as string);
  } catch (err) {
    logger.error('Failed to decrypt password', { error: err });
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const user = await getRepositories().users.findOne({ where: { email } });

  if (!user || user.provider !== 'password' || !user.passwordHash) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const valid = await Bun.password.verify(plainPassword, user.passwordHash);
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  if (user.mfaEnabled && user.mfaVerified && user.mfaSecret) {
    const challengeId = await createChallenge(user.email);
    return c.json({ mfa_required: true, challenge_id: challengeId }, 200);
  }

  const sessionId = randomUUID();
  await storeSession(sessionId, user.email, 'password', new Date(Date.now() + SESSION_TTL * 1000));

  return c.json(
    { user: { id: user.id, email: user.email, name: user.name, role: user.role, teamId: user.teamId } },
    200,
    { 'Set-Cookie': `session=${sessionId}; Path=/; Max-Age=${SESSION_TTL}; HttpOnly; SameSite=Lax` }
  );
});

// Complete login when MFA is enabled — exchange a pending challenge for a full session
app.post('/password/mfa-verify', async (c) => {
  if (!config.isSelfServe) return c.json({ error: 'Password auth not enabled' }, 403);

  let body: { challenge_id?: string; token?: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid request body' }, 400); }

  const { challenge_id, token } = body;
  if (!challenge_id || !token) return c.json({ error: 'challenge_id and token are required' }, 400);

  const email = await resolveChallenge(challenge_id);
  if (!email) return c.json({ error: 'Invalid or expired challenge' }, 401);

  const user = await getRepositories().users.findOne({ where: { email } });
  if (!user || !user.mfaSecret) return c.json({ error: 'Invalid credentials' }, 401);

  if (!verifyTotpCode(user.mfaSecret, token)) return c.json({ error: 'Invalid MFA code' }, 401);

  const sessionId = randomUUID();
  await storeSession(sessionId, user.email, 'password', new Date(Date.now() + SESSION_TTL * 1000));

  return c.json(
    { user: { id: user.id, email: user.email, name: user.name, role: user.role, teamId: user.teamId } },
    200,
    { 'Set-Cookie': `session=${sessionId}; Path=/; Max-Age=${SESSION_TTL}; HttpOnly; SameSite=Lax` }
  );
});

// Custom password register — hashes password and creates a new user
app.post('/password/register', async (c) => {
  if (!config.isSelfServe) {
    return c.json({ error: 'Password auth not enabled' }, 403);
  }

  let body: { email?: string; password?: string; encryptedPassword?: string; name?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const { email, password, encryptedPassword, name } = body;
  if (!email || (!password && !encryptedPassword)) {
    return c.json({ error: 'email and password are required' }, 400);
  }

  let plainPassword: string;
  try {
    plainPassword = authConfig.encryptionEnabled && encryptedPassword
      ? decryptPassword(encryptedPassword)
      : (password as string);
  } catch (err) {
    logger.error('Failed to decrypt password during register', { error: err });
    return c.json({ error: 'Invalid request' }, 400);
  }

  if (plainPassword.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400);
  }

  const existing = await getRepositories().users.findOne({ where: { email } });
  if (existing) {
    return c.json({ error: 'Email already registered' }, 409);
  }

  const passwordHash = await Bun.password.hash(plainPassword);

  const newUser = await getRepositories().users.create({
    email,
    name: name ?? email.split('@')[0],
    provider: 'password',
    providerId: email,
    passwordHash,
    role: 'team_member',
  });

  try {
    await ensureUserHasTeam(newUser.id, newUser.name);
  } catch (err) {
    logger.error('Failed to provision team for new user', { userId: newUser.id, err });
  }

  const sessionId = randomUUID();
  await storeSession(sessionId, newUser.email, 'password', new Date(Date.now() + SESSION_TTL * 1000));

  return c.json(
    { user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, teamId: newUser.teamId } },
    201,
    { 'Set-Cookie': `session=${sessionId}; Path=/; Max-Age=${SESSION_TTL}; HttpOnly; SameSite=Lax` }
  );
});

export default app;
