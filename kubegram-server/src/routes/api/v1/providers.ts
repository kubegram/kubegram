import { Hono } from 'hono';
import { getRepositories } from '@/repositories';
import { getCompanyIdFromTeam } from '@/services/entity-resolver';
import { requireAuth } from '@/middleware/auth';

const app = new Hono();

app.get('/', async (c) => {
    const auth = await requireAuth(c);
    if (auth instanceof Response) return auth;

    const user = auth.user;
    const repos = getRepositories();

    if (!user.teamId) {
        return c.json({ providers: [] });
    }

    const companyId = await getCompanyIdFromTeam(user.teamId);

    if (!companyId) {
        return c.json({ providers: [] });
    }

    const tokens = await repos.companyLlmTokens.findByCompanyId(companyId);

    const providerList = tokens.map(t => ({
        id: t.id,
        provider: t.provider,
        apiUrl: t.providerAPIUrl,
        models: t.models ? JSON.parse(t.models) : []
    }));

    if (providerList.length === 0 && process.env.NODE_ENV !== 'production') {
        providerList.push({
            id: -1,
            provider: 'DEEPSEEK',
            apiUrl: 'https://api.deepseek.com',
            models: ['deepseek-coder', 'deepseek-chat']
        });
    }

    return c.json({ providers: providerList });
});

app.post('/', async (c) => {
    const auth = await requireAuth(c);
    if (auth instanceof Response) return auth;

    try {
        const repos = getRepositories();
        const body = await c.req.json();
        const { provider, apiUrl, models } = body;

        const user = auth.user;
        if (!user.teamId) return c.json({ error: 'User not in a team' }, 400);

        const companyId = await getCompanyIdFromTeam(user.teamId);

        if (!companyId) {
            return c.json({ error: 'Company not found' }, 404);
        }

        const newToken = await repos.companyLlmTokens.create({
            companyId,
            provider,
            providerAPIUrl: apiUrl,
            models: models ? JSON.stringify(models) : undefined,
        });

        return c.json({
            id: newToken.id,
            provider: newToken.provider,
            apiUrl: newToken.providerAPIUrl,
            models: newToken.models ? JSON.parse(newToken.models) : []
        }, 201);

    } catch (e) {
        console.error('Error creating provider:', e);
        return c.json({ error: 'Invalid request' }, 400);
    }
});

app.put('/:id', async (c) => {
    const auth = await requireAuth(c);
    if (auth instanceof Response) return auth;

    try {
        const repos = getRepositories();
        const id = parseInt(c.req.param('id'));
        const body = await c.req.json();
        const { apiUrl, models } = body;

        const token = await repos.companyLlmTokens.findById(id);
        if (!token) return c.json({ error: 'Provider not found' }, 404);

        const user = auth.user;
        const companyId = await getCompanyIdFromTeam(user.teamId!);

        if (companyId !== token.companyId) {
            return c.json({ error: 'Unauthorized' }, 403);
        }

        const updated = await repos.companyLlmTokens.update(id, {
            providerAPIUrl: apiUrl,
            models: models ? JSON.stringify(models) : undefined,
        });

        return c.json({
            id: updated!.id,
            provider: updated!.provider,
            apiUrl: updated!.providerAPIUrl,
            models: updated!.models ? JSON.parse(updated!.models) : []
        });

    } catch (e) {
        console.error('Error updating provider:', e);
        return c.json({ error: 'Invalid request' }, 400);
    }
});

app.delete('/:id', async (c) => {
    const auth = await requireAuth(c);
    if (auth instanceof Response) return auth;

    try {
        const repos = getRepositories();
        const id = parseInt(c.req.param('id'));

        const token = await repos.companyLlmTokens.findById(id);
        if (!token) return c.json({ error: 'Provider not found' }, 404);

        const user = auth.user;
        const companyId = await getCompanyIdFromTeam(user.teamId!);

        if (companyId !== token.companyId) {
            return c.json({ error: 'Unauthorized' }, 403);
        }

        await repos.companyLlmTokens.delete(id);

        return c.json({ success: true });

    } catch (e) {
        console.error('Error deleting provider:', e);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

export default app;
