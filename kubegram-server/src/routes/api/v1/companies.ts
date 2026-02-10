import { Hono } from 'hono';
import { db } from '@/db';
import { companies, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

// GET /companies or GET /companies?organizationId=789
app.get('/', async (c) => {
    const organizationId = c.req.query('organizationId');

    // If organizationId query parameter is provided, look up company by organization
    if (organizationId) {
        const orgIdNum = parseInt(organizationId);
        if (isNaN(orgIdNum)) {
            return c.json({ error: 'Invalid organizationId parameter' }, 400);
        }

        // Find organization and its companyId
        const orgResult = await db.select()
            .from(organizations)
            .where(eq(organizations.id, orgIdNum))
            .limit(1);

        if (orgResult.length === 0) {
            return c.json({ error: 'Organization not found' }, 404);
        }

        const org = orgResult[0];
        if (!org.companyId) {
            return c.json({ error: 'Organization has no company assigned' }, 404);
        }

        // Get the company
        const companyResult = await db.select()
            .from(companies)
            .where(eq(companies.id, org.companyId))
            .limit(1);

        if (companyResult.length === 0) {
            return c.json({ error: 'Company not found' }, 404);
        }

        return c.json(companyResult[0]);
    }

    // Default behavior: return all companies
    const allCompanies = await db.select().from(companies);
    return c.json(allCompanies);
});

// GET /companies/:id
app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const company = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    if (company.length === 0) {
        return c.json({ error: 'Company not found' }, 404);
    }
    return c.json(company[0]);
});

// POST /companies
app.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const newCompany = await db.insert(companies).values({
            name: body.name,
            tokens: body.tokens || 0,
        }).returning();
        return c.json(newCompany[0], 201);
    } catch (error) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

// PUT /companies/:id
app.put('/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const updatedCompany = await db.update(companies)
            .set({
                name: body.name,
                tokens: body.tokens,
                updatedAt: new Date(),
            })
            .where(eq(companies.id, id))
            .returning();

        if (updatedCompany.length === 0) {
            return c.json({ error: 'Company not found' }, 404);
        }

        return c.json(updatedCompany[0]);
    } catch (error) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

// DELETE /companies/:id
app.delete('/:id', async (c) => {
    const id = c.req.param('id');
    await db.delete(companies).where(eq(companies.id, id));
    return c.body(null, 204);
});

export default app;