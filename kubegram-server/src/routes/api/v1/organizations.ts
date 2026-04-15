import { Hono } from 'hono';
import { getRepositories } from '@/repositories';

const app = new Hono();

app.get('/', async (c) => {
    const repos = getRepositories();
    const teamId = c.req.query('teamId');

    if (teamId) {
        const teamIdNum = parseInt(teamId);
        if (isNaN(teamIdNum)) {
            return c.json({ error: 'Invalid teamId parameter' }, 400);
        }

        const team = await repos.teams.findById(teamIdNum);
        if (!team) {
            return c.json({ error: 'Team not found' }, 404);
        }
        if (!team.organizationId) {
            return c.json({ error: 'Team has no organization assigned' }, 404);
        }

        const org = await repos.organizations.findById(team.organizationId);
        if (!org) {
            return c.json({ error: 'Organization not found' }, 404);
        }

        return c.json(org);
    }

    const allOrgs = await repos.organizations.findAll();
    return c.json(allOrgs);
});

app.get('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const repos = getRepositories();
    const org = await repos.organizations.findById(id);
    if (!org) {
        return c.json({ error: 'Organization not found' }, 404);
    }
    return c.json(org);
});

app.post('/', async (c) => {
    const repos = getRepositories();
    try {
        const body = await c.req.json();
        const newOrg = await repos.organizations.create({
            name: body.name,
            companyId: body.companyID,
        });
        return c.json(newOrg, 201);
    } catch (e) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

app.put('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const repos = getRepositories();
    try {
        const body = await c.req.json();
        const updated = await repos.organizations.update(id, body);
        if (!updated) {
            return c.json({ error: 'Organization not found' }, 404);
        }
        return c.json(updated);
    } catch (e) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

app.delete('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const repos = getRepositories();
    await repos.organizations.delete(id);
    return c.body(null, 204);
});

export default app;