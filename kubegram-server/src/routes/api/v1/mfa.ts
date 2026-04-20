import { Hono } from 'hono';
import { requireAuth } from '@/middleware/auth';
import { getRepositories } from '@/repositories';
import { generateTotpSecret, verifyTotpCode } from '@/services/mfa';
import logger from '@/utils/logger';

const app = new Hono();

// POST /mfa/setup — generate a TOTP secret for the authenticated user
app.post('/setup', async (c) => {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  const repos = getRepositories();
  const user = await repos.users.findById(parseInt(auth.user.id));
  if (!user) return c.json({ error: 'User not found' }, 404);

  if (user.mfaEnabled && user.mfaVerified) {
    return c.json({ error: 'MFA is already enabled. Disable it first.' }, 409);
  }

  const { secret, otpauthUrl } = generateTotpSecret(user.email);
  await repos.users.update(user.id, { mfaSecret: secret, mfaEnabled: false, mfaVerified: false });

  logger.info('MFA setup initiated', { userId: user.id });
  return c.json({ otpauthUrl, secret });
});

// POST /mfa/verify-setup — confirm the first TOTP code to activate MFA
app.post('/verify-setup', async (c) => {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  let body: { token?: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid request body' }, 400); }

  const { token } = body;
  if (!token) return c.json({ error: 'token is required' }, 400);

  const repos = getRepositories();
  const user = await repos.users.findById(parseInt(auth.user.id));
  if (!user) return c.json({ error: 'User not found' }, 404);

  if (!user.mfaSecret) return c.json({ error: 'MFA setup not initiated. Call /mfa/setup first.' }, 400);
  if (user.mfaEnabled && user.mfaVerified) return c.json({ error: 'MFA is already verified' }, 409);

  if (!verifyTotpCode(user.mfaSecret, token)) {
    return c.json({ error: 'Invalid TOTP code' }, 401);
  }

  await repos.users.update(user.id, { mfaEnabled: true, mfaVerified: true });

  logger.info('MFA enabled', { userId: user.id });
  return c.json({ success: true });
});

// DELETE /mfa/disable — disable MFA (requires a valid TOTP code)
app.delete('/disable', async (c) => {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  let body: { token?: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid request body' }, 400); }

  const { token } = body;
  if (!token) return c.json({ error: 'token is required' }, 400);

  const repos = getRepositories();
  const user = await repos.users.findById(parseInt(auth.user.id));
  if (!user) return c.json({ error: 'User not found' }, 404);

  if (!user.mfaEnabled || !user.mfaVerified || !user.mfaSecret) {
    return c.json({ error: 'MFA is not enabled' }, 400);
  }

  if (!verifyTotpCode(user.mfaSecret, token)) {
    return c.json({ error: 'Invalid TOTP code' }, 401);
  }

  await repos.users.update(user.id, { mfaEnabled: false, mfaSecret: null, mfaVerified: false });

  logger.info('MFA disabled', { userId: user.id });
  return c.json({ success: true });
});

export default app;
