import { Hono } from 'hono';
import { db } from '@/db';
import { operatorTokens } from '@/db/schema';
import { eq, desc, isNull } from 'drizzle-orm';
import { requireRole } from '@/middleware/auth';

const app = new Hono();

app.get('/', requireRole('admin'), async (c) => {
  const tokens = await db.select({
    id: operatorTokens.id,
    token: operatorTokens.token,
    companyId: operatorTokens.companyId,
    clusterId: operatorTokens.clusterId,
    label: operatorTokens.label,
    createdAt: operatorTokens.createdAt,
    expiresAt: operatorTokens.expiresAt,
    revokedAt: operatorTokens.revokedAt,
  })
  .from(operatorTokens)
  .where(isNull(operatorTokens.revokedAt))
  .orderBy(desc(operatorTokens.createdAt));

  return c.json({ tokens });
});

app.post('/', requireRole('admin'), async (c) => {
  const body = await c.req.json() as {
    companyId?: string;
    label?: string;
    expiresAt?: string;
  };

  const token = crypto.randomUUID() + crypto.randomUUID();

  const [created] = await db.insert(operatorTokens).values({
    token,
    companyId: body.companyId || null,
    label: body.label || null,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
  }).returning({
    id: operatorTokens.id,
    token: operatorTokens.token,
    companyId: operatorTokens.companyId,
    label: operatorTokens.label,
    createdAt: operatorTokens.createdAt,
    expiresAt: operatorTokens.expiresAt,
  });

  return c.json({ token: created.token }, 201);
});

app.delete('/:id', requireRole('admin'), async (c) => {
  const id = parseInt(c.req.param('id'));
  
  if (isNaN(id)) {
    return c.json({ error: 'Invalid token ID' }, 400);
  }

  await db.update(operatorTokens)
    .set({ revokedAt: new Date() })
    .where(eq(operatorTokens.id, id));

  return c.json({ ok: true });
});

export default app;
