import { Hono } from 'hono';
import { db } from '@/db';
import { organizations, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

// /organizations routes
app.post('/organizations', async (c) => {
    try {
        const body = await c.req.json();
        if (body.kind !== 'Organization') {
            return c.json({ error: 'Invalid Kind' }, 400);
        }

        const [org] = await db.insert(organizations).values({
            name: body.metadata.name,
            companyId: body.spec.companyID
        }).returning();
        return c.json(org, 201);
    } catch (e) {
        console.error(e);
        return c.json({ error: 'Invalid request' }, 400);
    }
});

app.put('/organizations/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const [org] = await db.update(organizations).set({
            name: body.metadata.name,
            companyId: body.spec.companyID,
            updatedAt: new Date()
        }).where(eq(organizations.id, parseInt(id))).returning();

        if (!org) {
            return c.json({ error: 'Not Found' }, 404);
        }
        return c.json(org);
    } catch (e) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

app.delete('/organizations/:id', async (c) => {
    const id = c.req.param('id');
    await db.delete(organizations).where(eq(organizations.id, parseInt(id)));
    return c.body(null, 204);
});

// /teams routes
app.post('/teams', async (c) => {
    try {
        const body = await c.req.json();
        if (body.kind !== 'Team') {
            return c.json({ error: 'Invalid Kind' }, 400);
        }

        const [team] = await db.insert(teams).values({
            name: body.metadata.name,
            organizationId: body.spec.organizationID
        }).returning();
        return c.json(team, 201);
    } catch (e) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

app.put('/teams/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const [team] = await db.update(teams).set({
            name: body.metadata.name,
            organizationId: body.spec.organizationID,
            updatedAt: new Date()
        }).where(eq(teams.id, parseInt(id))).returning();

        if (!team) {
            return c.json({ error: 'Not Found' }, 404);
        }
        return c.json(team);
    } catch (e) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

app.delete('/teams/:id', async (c) => {
    const id = c.req.param('id');
    await db.delete(teams).where(eq(teams.id, parseInt(id)));
    return c.body(null, 204);
});

export default app;