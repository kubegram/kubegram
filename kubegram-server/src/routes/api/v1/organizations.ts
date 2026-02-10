import { Hono } from 'hono';
import { db } from '@/db';
import { organizations, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

// GET /organizations or GET /organizations?teamId=456
app.get('/', async (c) => {
    const teamId = c.req.query('teamId');

    // If teamId query parameter is provided, look up organization by team
    if (teamId) {
        const teamIdNum = parseInt(teamId);
        if (isNaN(teamIdNum)) {
            return c.json({ error: 'Invalid teamId parameter' }, 400);
        }

        // Find team and its organizationId
        const teamResult = await db.select()
            .from(teams)
            .where(eq(teams.id, teamIdNum))
            .limit(1);

        if (teamResult.length === 0) {
            return c.json({ error: 'Team not found' }, 404);
        }

        const team = teamResult[0];
        if (!team.organizationId) {
            return c.json({ error: 'Team has no organization assigned' }, 404);
        }

        // Get the organization
        const orgResult = await db.select()
            .from(organizations)
            .where(eq(organizations.id, team.organizationId))
            .limit(1);

        if (orgResult.length === 0) {
            return c.json({ error: 'Organization not found' }, 404);
        }

        return c.json(orgResult[0]);
    }

    // Default behavior: return all organizations
    const allOrgs = await db.select().from(organizations);
    return c.json(allOrgs);
});

// GET /organizations/:id
app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const org = await db.select().from(organizations).where(eq(organizations.id, parseInt(id))).limit(1);
    if (org.length === 0) {
        return c.json({ error: 'Organization not found' }, 404);
    }
    return c.json(org[0]);
});

// POST /organizations
app.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const newOrg = await db.insert(organizations).values({
            name: body.name,
            companyId: body.companyID,
        }).returning();
        return c.json(newOrg[0], 201);
    } catch (e) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

// PUT /organizations/:id
app.put('/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const updatedOrg = await db.update(organizations)
            .set({
                name: body.name,
                companyId: body.companyID,
                updatedAt: new Date(),
            })
            .where(eq(organizations.id, parseInt(id)))
            .returning();

        if (updatedOrg.length === 0) {
            return c.json({ error: 'Organization not found' }, 404);
        }

        return c.json(updatedOrg[0]);
    } catch (e) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

// DELETE /organizations/:id
app.delete('/:id', async (c) => {
    const id = c.req.param('id');
    await db.delete(organizations).where(eq(organizations.id, parseInt(id)));
    return c.body(null, 204);
});

export default app;