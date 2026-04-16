import { Hono } from 'hono';
import { getRepositories } from '@/repositories';
import { requireAuth } from '@/middleware/auth';

const app = new Hono();

app.get('/me', async (c) => {
    const auth = await requireAuth(c);
    if (auth instanceof Response) return auth;
    return c.json(auth.user);
});

app.get('/', async (c) => {
    const repos = getRepositories();
    const allUsers = await repos.users.findAll();
    return c.json(allUsers);
});

app.post('/', async (c) => {
    const repos = getRepositories();
    try {
        const body = await c.req.json();
        const newUser = await repos.users.create({
            name: body.name,
            email: body.email,
            avatarUrl: body.avatar_url,
            role: body.role,
            provider: body.provider,
            providerId: body.provider_id,
            teamId: body.teamID,
        });
        return c.json(newUser, 201);
    } catch {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

export default app;