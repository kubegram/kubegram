import { Hono } from 'hono';
import { getRepositories } from '@/repositories';
import { requireRole } from '@/middleware/auth';

const app = new Hono();

app.get('/', requireRole('admin'), async (c) => {
  const repos = getRepositories();
  const all = await repos.operatorTokens.findAll();
  const tokens = all.filter(t => !t.revokedAt).sort((a, b) => 
    (new Date(b.createdAt ?? 0).getTime()) - (new Date(a.createdAt ?? 0).getTime())
  );

  return c.json({ tokens });
});

app.post('/', requireRole('admin'), async (c) => {
  const repos = getRepositories();
  const body = await c.req.json() as {
    companyId?: string;
    label?: string;
    expiresAt?: string;
  };

  const token = crypto.randomUUID() + crypto.randomUUID();

  const created = await repos.operatorTokens.create({
    token,
    companyId: body.companyId || null,
    label: body.label || null,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
  } as any);

  return c.json({ token: created.token }, 201);
});

app.delete('/:id', requireRole('admin'), async (c) => {
  const id = parseInt(c.req.param('id') || '');
  
  if (isNaN(id)) {
    return c.json({ error: 'Invalid token ID' }, 400);
  }

  const repos = getRepositories();
  await repos.operatorTokens.update(id, { revokedAt: new Date() });

  return c.json({ ok: true });
});

export default app;
