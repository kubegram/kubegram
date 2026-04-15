import { Hono } from 'hono';
import { getRepositories } from '@/repositories';
import type { Company } from '@/db/schema';

const app = new Hono();

// GET /companies or GET /companies?organizationId=789
app.get('/', async (c) => {
    const repos = getRepositories();
    const organizationId = c.req.query('organizationId');

    if (organizationId) {
        const orgIdNum = parseInt(organizationId);
        if (isNaN(orgIdNum)) {
            return c.json({ error: 'Invalid organizationId parameter' }, 400);
        }

        const org = await repos.organizations.findById(orgIdNum);
        if (!org) {
            return c.json({ error: 'Organization not found' }, 404);
        }
        if (!org.companyId) {
            return c.json({ error: 'Organization has no company assigned' }, 404);
        }

        const company = await repos.companies.findById(org.companyId);
        if (!company) {
            return c.json({ error: 'Company not found' }, 404);
        }

        return c.json(company);
    }

    const allCompanies = await repos.companies.findAll();
    return c.json(allCompanies);
});

// GET /companies/:id
app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const repos = getRepositories();
    const company = await repos.companies.findById(id);
    if (!company) {
        return c.json({ error: 'Company not found' }, 404);
    }
    return c.json(company);
});

// POST /companies
app.post('/', async (c) => {
    try {
        const repos = getRepositories();
        const body = await c.req.json<Partial<Company>>();
        const newCompany = await repos.companies.create({
            name: body.name ?? '',
            tokens: body.tokens ?? 0,
        });
        return c.json(newCompany, 201);
    } catch (error) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

// PUT /companies/:id
app.put('/:id', async (c) => {
    const id = c.req.param('id');
    const repos = getRepositories();
    try {
        const body = await c.req.json();
        const updated = await repos.companies.update(id, body);
        if (!updated) {
            return c.json({ error: 'Company not found' }, 404);
        }
        return c.json(updated);
    } catch (error) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

// DELETE /companies/:id
app.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const repos = getRepositories();
    await repos.companies.delete(id);
    return c.body(null, 204);
});

export default app;