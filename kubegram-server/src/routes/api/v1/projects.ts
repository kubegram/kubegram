import { Hono } from 'hono';
import { getRepositories } from '@/repositories';

const app = new Hono();

app.get('/', async (c) => {
    const repos = getRepositories();
    const items = await repos.projects.findAll();
    return c.json(items);
});

app.get('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const repos = getRepositories();
    const item = await repos.projects.findById(id);
    if (!item) {
        return c.notFound();
    }
    return c.json(item);
});

app.post('/', async (c) => {
    const repos = getRepositories();
    try {
        const body = await c.req.json();
        const item = await repos.projects.create({
            name: body.name,
            graphId: body.graphId,
            graphMeta: body.graphMeta ? JSON.stringify(body.graphMeta) : undefined
        });
        return c.json(item, 201);
    } catch (e) {
        console.error(e);
        return c.json({ error: 'Invalid request' }, 400);
    }
});

app.put('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const repos = getRepositories();
    try {
        const body = await c.req.json();
        const item = await repos.projects.update(id, body);
        if (!item) {
            return c.notFound();
        }
        return c.json(item);
    } catch (e) {
        console.error(e);
        return c.json({ error: 'Invalid request' }, 400);
    }
});

app.delete('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const repos = getRepositories();
    await repos.projects.delete(id);
    return c.body(null, 204);
});

export default app;