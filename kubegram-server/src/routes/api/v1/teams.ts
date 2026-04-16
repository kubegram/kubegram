import { Hono } from 'hono';
import { getRepositories } from '@/repositories';

const app = new Hono();

// GET /teams or GET /teams?userId=123
app.get('/', async (c) => {
    const repos = getRepositories();
    const userId = c.req.query('userId');

    if (userId) {
        const userIdNum = parseInt(userId);
        if (isNaN(userIdNum)) {
            return c.json({ error: 'Invalid userId parameter' }, 400);
        }

        const user = await repos.users.findById(userIdNum);
        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }
        if (!user.teamId) {
            return c.json({ error: 'User has no team assigned' }, 404);
        }

        const team = await repos.teams.findById(user.teamId);
        if (!team) {
            return c.json({ error: 'Team not found' }, 404);
        }

        return c.json(team);
    }

    const allTeams = await repos.teams.findAll();
    return c.json(allTeams);
});

// GET /teams/:id
app.get('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const repos = getRepositories();
    const team = await repos.teams.findById(id);
    if (!team) {
        return c.json({ error: 'Team not found' }, 404);
    }
    return c.json(team);
});

// POST /teams
app.post('/', async (c) => {
    const repos = getRepositories();
    try {
        const body = await c.req.json();
        const newTeam = await repos.teams.create({
            name: body.name,
            organizationId: body.organizationID,
        });
        return c.json(newTeam, 201);
    } catch {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

// PUT /teams/:id
app.put('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const repos = getRepositories();
    try {
        const body = await c.req.json();
        const updated = await repos.teams.update(id, body);
        if (!updated) {
            return c.json({ error: 'Team not found' }, 404);
        }
        return c.json(updated);
    } catch {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

// DELETE /teams/:id
app.delete('/:id', async (c) => {
    const id = parseInt(c.req.param('id'));
    const repos = getRepositories();
    await repos.teams.delete(id);
    return c.body(null, 204);
});

export default app;