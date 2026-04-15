import { Hono } from 'hono';
import { getRepositories } from '@/repositories';
import { requireRole } from '@/middleware/auth';

const app = new Hono();

app.post('/register', async (c) => {
  const repos = getRepositories();
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.slice(7);

  const tokenData = await repos.operatorTokens.findByToken(token);

  if (!tokenData) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  if (tokenData.revokedAt) {
    return c.json({ error: 'Token has been revoked' }, 401);
  }

  if (tokenData.expiresAt && tokenData.expiresAt < new Date()) {
    return c.json({ error: 'Token has expired' }, 401);
  }

  const body = await c.req.json() as {
    clusterId: string;
    version?: string;
    mcpEndpoint?: string;
  };

  if (!body.clusterId) {
    return c.json({ error: 'clusterId is required' }, 400);
  }

  const existing = await repos.operators.findByClusterId(body.clusterId);

  if (existing) {
    await repos.operators.update(existing.id, {
      version: body.version || null,
      mcpEndpoint: body.mcpEndpoint || null,
      lastSeenAt: new Date(),
      status: 'online',
    });

    return c.json({ ok: true, message: 'Operator updated' });
  }

  const created = await repos.operators.create({
    clusterId: body.clusterId,
    tokenId: tokenData.id,
    companyId: tokenData.companyId ?? undefined,
    version: body.version,
    mcpEndpoint: body.mcpEndpoint,
    status: 'online',
  } as any);

  if (tokenData.clusterId === null) {
    await repos.operatorTokens.update(tokenData.id, { clusterId: body.clusterId });
  }

  return c.json({ ok: true, id: created.id }, 201);
});

app.get('/', requireRole('admin'), async (c) => {
  const repos = getRepositories();
  const operatorList = await repos.operators.findAll();
  const sorted = operatorList.sort((a, b) => 
    (new Date(b.lastSeenAt ?? 0).getTime()) - (new Date(a.lastSeenAt ?? 0).getTime())
  );

  return c.json({ operators: sorted });
});

app.delete('/:id', requireRole('admin'), async (c) => {
  const id = parseInt(c.req.param('id') || '');
  
  if (isNaN(id)) {
    return c.json({ error: 'Invalid operator ID' }, 400);
  }

  const repos = getRepositories();
  await repos.operators.delete(id);

  return c.json({ ok: true });
});

export default app;
