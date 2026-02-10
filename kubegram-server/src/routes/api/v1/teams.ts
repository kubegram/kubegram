import { Hono } from 'hono';
import { db } from '@/db';
import { teams, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

// GET /teams or GET /teams?userId=123
app.get('/', async (c) => {
    const userId = c.req.query('userId');

    // If userId query parameter is provided, look up team by user
    if (userId) {
        const userIdNum = parseInt(userId);
        if (isNaN(userIdNum)) {
            return c.json({ error: 'Invalid userId parameter' }, 400);
        }

        // Find user and their teamId
        const userResult = await db.select()
            .from(users)
            .where(eq(users.id, userIdNum))
            .limit(1);

        if (userResult.length === 0) {
            return c.json({ error: 'User not found' }, 404);
        }

        const user = userResult[0];
        if (!user.teamId) {
            return c.json({ error: 'User has no team assigned' }, 404);
        }

        // Get the team
        const teamResult = await db.select()
            .from(teams)
            .where(eq(teams.id, user.teamId))
            .limit(1);

        if (teamResult.length === 0) {
            return c.json({ error: 'Team not found' }, 404);
        }

        return c.json(teamResult[0]);
    }

    // Default behavior: return all teams
    const allTeams = await db.select().from(teams);
    return c.json(allTeams);
});

// GET /teams/:id
app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const team = await db.select().from(teams).where(eq(teams.id, parseInt(id))).limit(1);
    if (team.length === 0) {
        return c.json({ error: 'Team not found' }, 404);
    }
    return c.json(team[0]);
});

// POST /teams
app.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const newTeam = await db.insert(teams).values({
            name: body.name,
            organizationId: body.organizationID,
        }).returning();
        return c.json(newTeam[0], 201);
    } catch (e) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

// PUT /teams/:id
app.put('/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const updatedTeam = await db.update(teams)
            .set({
                name: body.name,
                organizationId: body.organizationID,
                updatedAt: new Date(),
            })
            .where(eq(teams.id, parseInt(id)))
            .returning();

        if (updatedTeam.length === 0) {
            return c.json({ error: 'Team not found' }, 404);
        }

        return c.json(updatedTeam[0]);
    } catch (e) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

// DELETE /teams/:id
app.delete('/:id', async (c) => {
    const id = c.req.param('id');
    await db.delete(teams).where(eq(teams.id, parseInt(id)));
    return c.body(null, 204);
});

export default app;