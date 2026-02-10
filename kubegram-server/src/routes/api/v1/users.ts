import { Hono } from 'hono';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireAuth } from '@/middleware/auth';

const app = new Hono();

// GET /users/me - Get current authenticated user
app.get('/me', async (c) => {
    const auth = await requireAuth(c);
    if (auth instanceof Response) return auth;
    return c.json(auth.user);
});

// GET /users (list all users - according to swagger)
app.get('/', async (c) => {
    const allUsers = await db.select().from(users);
    return c.json(allUsers);
});

// POST /users
app.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const newUser = await db.insert(users).values({
            name: body.name,
            email: body.email,
            avatarUrl: body.avatar_url,
            role: body.role,
            provider: body.provider,
            providerId: body.provider_id,
            teamId: body.teamID,
        }).returning();
        return c.json(newUser[0], 201);
    } catch (e) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

export default app;