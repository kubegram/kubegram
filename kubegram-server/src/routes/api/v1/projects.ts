import { Hono } from 'hono';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

// GET /projects
app.get('/', async (c) => {
    const items = await db.select().from(projects);
    return c.json(items);
});

// GET /projects/:id
app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const items = await db.select().from(projects).where(eq(projects.id, parseInt(id))).limit(1);
    if (items.length === 0) {
        return c.notFound();
    }
    return c.json(items[0]);
});

// POST /projects
app.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const [item] = await db.insert(projects).values({
            name: body.name,
            graphId: body.graphId,
            graphMeta: body.graphMeta ? JSON.stringify(body.graphMeta) : undefined
        }).returning();
        return c.json(item, 201);
    } catch (e) {
        console.error(e);
        return c.json({ error: 'Invalid request' }, 400);
    }
});

// PUT /projects/:id
app.put('/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const [item] = await db.update(projects).set({
            name: body.name,
            graphId: body.graphId,
            graphMeta: body.graphMeta ? JSON.stringify(body.graphMeta) : undefined,
            updatedAt: new Date()
        }).where(eq(projects.id, parseInt(id))).returning();

        if (!item) {
            return c.notFound();
        }
        return c.json(item);
    } catch (e) {
        console.error(e);
        return c.json({ error: 'Invalid request' }, 400);
    }
});

// DELETE /projects/:id
app.delete('/:id', async (c) => {
    const id = c.req.param('id');
    await db.delete(projects).where(eq(projects.id, parseInt(id)));
    return c.body(null, 204);
});

export default app;