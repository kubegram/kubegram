import { Hono } from 'hono';
import { db } from '@/db';
import { teams, organizations, companyLlmTokens } from '@/db/schema';
import { requireAuth } from '@/middleware/auth';
import { eq } from 'drizzle-orm';

const app = new Hono();

/**
 * Helper to resolve companyId from a teamId via team -> organization -> company chain.
 * Returns null if any link in the chain is missing.
 */
async function getCompanyIdFromTeam(teamId: number): Promise<string | null> {
    const [team] = await db.select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);

    if (!team?.organizationId) return null;

    const [org] = await db.select()
        .from(organizations)
        .where(eq(organizations.id, team.organizationId))
        .limit(1);

    return org?.companyId ?? null;
}

// GET /api/v1/providers
app.get('/', async (c) => {
    const auth = await requireAuth(c);
    if (auth instanceof Response) return auth;

    const user = auth.user;

    if (!user.teamId) {
        return c.json({ providers: [] });
    }

    const companyId = await getCompanyIdFromTeam(user.teamId);

    if (!companyId) {
        return c.json({ providers: [] });
    }

    // 2. Get LLM Tokens for the company
    // 2. Get LLM Tokens for the company
    const tokens = await db.select({
        id: companyLlmTokens.id,
        provider: companyLlmTokens.provider,
        providerApiUrl: companyLlmTokens.providerAPIUrl,
        models: companyLlmTokens.models
    })
        .from(companyLlmTokens)
        .where(eq(companyLlmTokens.companyId, companyId));

    const providerList = tokens.map(t => ({
        id: t.id,
        provider: t.provider,
        apiUrl: t.providerApiUrl,
        models: t.models ? JSON.parse(t.models) : []
    }));

    // Default provider for local dev if list is empty
    if (providerList.length === 0 && process.env.NODE_ENV !== 'production') {
        providerList.push({
            id: -1,
            provider: 'DEEPSEEK',
            apiUrl: 'https://api.deepseek.com',
            models: ['deepseek-coder', 'deepseek-chat']
        });
    }

    return c.json({
        providers: providerList
    });
});

// POST /api/v1/providers - Add a new provider (without token)
app.post('/', async (c) => {
    const auth = await requireAuth(c);
    if (auth instanceof Response) return auth;

    try {
        const body = await c.req.json();
        const { provider, apiUrl, models } = body;

        const user = auth.user;
        if (!user.teamId) return c.json({ error: 'User not in a team' }, 400);

        // Find companyId
        const companyId = await getCompanyIdFromTeam(user.teamId);

        if (!companyId) {
            return c.json({ error: 'Company not found' }, 404);
        }

        // Create provider entry
        const [newToken] = await db.insert(companyLlmTokens).values({
            companyId,
            provider,
            providerAPIUrl: apiUrl,
            models: models ? JSON.stringify(models) : undefined,
            // encryptedTokenUrl is nullable now, so we can omit it
        }).returning();

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

// PUT /api/v1/providers/:id - Update provider (URL, models)
app.put('/:id', async (c) => {
    const auth = await requireAuth(c);
    if (auth instanceof Response) return auth;

    try {
        const id = parseInt(c.req.param('id'));
        const body = await c.req.json();
        const { apiUrl, models } = body;

        // Verify ownership
        const [token] = await db.select()
            .from(companyLlmTokens)
            .where(eq(companyLlmTokens.id, id))
            .limit(1);

        if (!token) return c.json({ error: 'Provider not found' }, 404);

        // Check user belongs to company
        const user = auth.user;
        const companyId = await getCompanyIdFromTeam(user.teamId!);

        if (companyId !== token.companyId) {
            return c.json({ error: 'Unauthorized' }, 403);
        }

        const [updated] = await db.update(companyLlmTokens)
            .set({
                providerAPIUrl: apiUrl,
                models: models ? JSON.stringify(models) : undefined,
                updatedAt: new Date()
            })
            .where(eq(companyLlmTokens.id, id))
            .returning();

        return c.json({
            id: updated.id,
            provider: updated.provider,
            apiUrl: updated.providerAPIUrl,
            models: updated.models ? JSON.parse(updated.models) : []
        });

    } catch (e) {
        console.error('Error updating provider:', e);
        return c.json({ error: 'Invalid request' }, 400);
    }
});

// DELETE /api/v1/providers/:id - Remove provider
app.delete('/:id', async (c) => {
    const auth = await requireAuth(c);
    if (auth instanceof Response) return auth;

    try {
        const id = parseInt(c.req.param('id'));

        // Verify ownership
        const [token] = await db.select()
            .from(companyLlmTokens)
            .where(eq(companyLlmTokens.id, id))
            .limit(1);

        if (!token) return c.json({ error: 'Provider not found' }, 404);

        const user = auth.user;
        const companyId = await getCompanyIdFromTeam(user.teamId!);

        if (companyId !== token.companyId) {
            return c.json({ error: 'Unauthorized' }, 403);
        }

        await db.delete(companyLlmTokens).where(eq(companyLlmTokens.id, id));

        return c.json({ success: true });

    } catch (e) {
        console.error('Error deleting provider:', e);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

export default app;
