import { Hono } from 'hono';
import { db } from '@/db';
import { operators, operatorTokens } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireRole } from '@/middleware/auth';

const app = new Hono();

app.post('/register', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.slice(7);

  const tokenRecord = await db.select()
    .from(operatorTokens)
    .where(eq(operatorTokens.token, token))
    .limit(1);

  if (tokenRecord.length === 0) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  const tokenData = tokenRecord[0];

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

  const existing = await db.select()
    .from(operators)
    .where(eq(operators.clusterId, body.clusterId))
    .limit(1);

  if (existing.length > 0) {
    await db.update(operators)
      .set({
        version: body.version || null,
        mcpEndpoint: body.mcpEndpoint || null,
        lastSeenAt: new Date(),
        status: 'online',
      })
      .where(eq(operators.id, existing[0].id));

    return c.json({ ok: true, message: 'Operator updated' });
  }

  const [created] = await db.insert(operators).values({
    clusterId: body.clusterId,
    tokenId: tokenData.id,
    companyId: tokenData.companyId,
    version: body.version || null,
    mcpEndpoint: body.mcpEndpoint || null,
    status: 'online',
  }).returning({
    id: operators.id,
    clusterId: operators.clusterId,
  });

  if (tokenData.clusterId === null) {
    await db.update(operatorTokens)
      .set({ clusterId: body.clusterId })
      .where(eq(operatorTokens.id, tokenData.id));
  }

  return c.json({ ok: true, id: created.id }, 201);
});

app.get('/', requireRole('admin'), async (c) => {
  const operatorList = await db.select({
    id: operators.id,
    clusterId: operators.clusterId,
    companyId: operators.companyId,
    version: operators.version,
    mcpEndpoint: operators.mcpEndpoint,
    status: operators.status,
    lastSeenAt: operators.lastSeenAt,
    registeredAt: operators.registeredAt,
  })
  .from(operators)
  .orderBy(desc(operators.lastSeenAt));

  return c.json({ operators: operatorList });
});

app.delete('/:id', requireRole('admin'), async (c) => {
  const id = parseInt(c.req.param('id'));
  
  if (isNaN(id)) {
    return c.json({ error: 'Invalid operator ID' }, 400);
  }

  await db.delete(operators).where(eq(operators.id, id));

  return c.json({ ok: true });
});

export default app;
