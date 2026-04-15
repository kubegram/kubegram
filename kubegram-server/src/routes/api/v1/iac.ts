import { Hono } from 'hono';
import { getRepositories } from '@/repositories';

const app = new Hono();

app.post('/organizations', async (c) => {
    const repos = getRepositories();
    try {
        const body = await c.req.json();
        if (body.kind !== 'Organization') {
            return c.json({ error: 'Invalid Kind' }, 400);
        }

        const org = await repos.organizations.create({
            name: body.metadata.name,
            companyId: body.spec.companyID
        });
        return c.json(org, 201);
    } catch (e) {
        console.error(e);
        return c.json({ error: 'Invalid request' }, 400);
    }
});

app.put('/organizations/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const repos = getRepositories();
    try {
        const body = await c.req.json();
        const org = await repos.organizations.update(id, {
            name: body.metadata.name,
            companyId: body.spec.companyID,
        });

        if (!org) {
            return c.json({ error: 'Not Found' }, 404);
        }
        return c.json(org);
    } catch (e) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

app.delete('/organizations/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const repos = getRepositories();
    await repos.organizations.delete(id);
    return c.body(null, 204);
});

app.post('/teams', async (c) => {
    const repos = getRepositories();
    try {
        const body = await c.req.json();
        if (body.kind !== 'Team') {
            return c.json({ error: 'Invalid Kind' }, 400);
        }

        const team = await repos.teams.create({
            name: body.metadata.name,
            organizationId: body.spec.organizationID
        });
        return c.json(team, 201);
    } catch (e) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

app.put('/teams/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const repos = getRepositories();
    try {
        const body = await c.req.json();
        const team = await repos.teams.update(id, {
            name: body.metadata.name,
            organizationId: body.spec.organizationID,
        });

        if (!team) {
            return c.json({ error: 'Not Found' }, 404);
        }
        return c.json(team);
    } catch (e) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

app.delete('/teams/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const repos = getRepositories();
    await repos.teams.delete(id);
    return c.body(null, 204);
});

export default app;