import { Hono } from 'hono';
import * as v from 'valibot';
import { db } from '@/db';
import { users, teams, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';

import { GraphSchema } from './types';
import { type AuthContext } from '@/middleware/auth';
import { graphqlSdk } from '@/clients/rag-client';
import { cleanGraphInput } from '@/utils/graph-input-cleaner';

type Variables = {
    auth: AuthContext;
};

const crudRoutes = new Hono<{ Variables: Variables }>();

/**
 * Helper to get company ID for the authenticated user
 */
async function getUserCompanyId(userId: number): Promise<string> {
    const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user?.teamId) {
        throw new Error('User does not belong to a valid company context');
    }

    const [team] = await db.select()
        .from(teams)
        .where(eq(teams.id, user.teamId))
        .limit(1);

    if (!team?.organizationId) {
        throw new Error('User does not belong to a valid company context');
    }

    const [org] = await db.select()
        .from(organizations)
        .where(eq(organizations.id, team.organizationId))
        .limit(1);

    if (!org?.companyId) {
        throw new Error('User does not belong to a valid company context');
    }

    return org.companyId;
}

/**
 * POST /api/public/v1/graph/crud
 * Create a new graph in RAG system
 */
crudRoutes.post('/', async (c) => {
    try {
        const auth = c.get('auth');
        const body = await c.req.json();

        // Validate request body
        const validatedGraph = v.parse(GraphSchema, body);

        // Clean UI-specific fields and strip incompatible bridges
        const cleanedGraph = cleanGraphInput(validatedGraph as any);

        // Resolve user's actual companyId for security validation
        const userCompanyId = await getUserCompanyId(parseInt(auth.user.id));

        // SECURITY VALIDATION - Ensure request matches authenticated user
        if (cleanedGraph.companyId !== userCompanyId) {
            console.warn(`Security violation: User ${auth.user.id} attempted to create graph with companyId ${cleanedGraph.companyId}, but belongs to ${userCompanyId}`);
            return c.json({ 
                error: 'Unauthorized: companyId does not match user\'s company context',
                code: 'COMPANY_MISMATCH' 
            }, 403);
        }

        if (cleanedGraph.userId !== auth.user.id) {
            console.warn(`Security violation: User ${auth.user.id} attempted to create graph with userId ${cleanedGraph.userId}`);
            return c.json({ 
                error: 'Unauthorized: userId does not match authenticated user',
                code: 'USER_MISMATCH' 
            }, 403);
        }

        // Call RAG System with validated values
        const response = await graphqlSdk.CreateGraph({
            input: {
                name: cleanedGraph.name,
                description: cleanedGraph.description,
                graphType: cleanedGraph.graphType as any, // Cast to expected enum
                companyId: userCompanyId,      // Use validated value
                userId: auth.user.id,          // Use validated value
                nodes: cleanedGraph.nodes,
            }
        });

        if (response.errors) {
            console.error('CreateGraph GraphQL errors:', response.errors);
            return c.json({ error: 'Failed to create graph in RAG system', details: response.errors }, 500);
        }

        return c.json({ graph: response.data.createGraph }, 201);

    } catch (error) {
        if (error instanceof v.ValiError) {
            return c.json({ error: 'Validation error', details: error.message }, 400);
        }
        console.error('Create graph error:', error);
        return c.json({ error: 'Failed to create graph' }, 500);
    }
});

/**
 * GET /api/public/v1/graph/crud
 * List graphs from RAG system
 */
crudRoutes.get('/', async (c) => {
    try {
        const auth = c.get('auth');

        // Resolve Company ID
        let companyId: string;
        try {
            companyId = await getUserCompanyId(parseInt(auth.user.id));
        } catch (e) {
            return c.json({ error: (e as Error).message }, 403);
        }

        const response = await graphqlSdk.GetGraphs({
            companyId: companyId
        });

        if (response.errors) {
            console.error('GetGraphs GraphQL errors:', response.errors);
            return c.json({ error: 'Failed to fetch graphs', details: response.errors }, 500);
        }

        return c.json({ graphs: response.data.graphs });

    } catch (error) {
        console.error('List graphs error:', error);
        return c.json({ error: 'Failed to list graphs' }, 500);
    }
});

/**
 * GET /api/public/v1/graph/crud/:id
 * Get a specific graph from RAG system
 */
crudRoutes.get('/:id', async (c) => {
    try {
        const id = c.req.param('id');
         const auth = c.get('auth');
        // Resolve Company ID
        let companyId: string;
        try {
            companyId = await getUserCompanyId(parseInt(auth.user.id));
        } catch (e) {
            return c.json({ error: (e as Error).message }, 403);
        }

        const response = await graphqlSdk.Graph({
            id: id,
            companyId: companyId
        });

        if (response.errors) {
            return c.json({ error: 'Failed to fetch graph', details: response.errors }, 500);
        }

        if (!response.data.graph) {
            return c.json({ error: 'Graph not found' }, 404);
        }

        return c.json({ graph: response.data.graph });

    } catch (error) {
        console.error('Get graph error:', error);
        return c.json({ error: 'Failed to get graph' }, 500);
    }
});

/**
 * PUT /api/public/v1/graph/crud/:id
 * Update a graph in RAG system
 */
crudRoutes.put('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const auth = c.get('auth');  // Add auth check
        const body = await c.req.json();

        // Validate request body
        const validatedGraph = v.parse(GraphSchema, body);

        // Clean UI-specific fields and strip incompatible bridges
        const cleanedGraph = cleanGraphInput(validatedGraph as any);

        // Resolve user's actual companyId for security validation
        const userCompanyId = await getUserCompanyId(parseInt(auth.user.id));

        // SECURITY VALIDATION - Ensure request matches authenticated user
        if (cleanedGraph.companyId !== userCompanyId) {
            console.warn(`Security violation: User ${auth.user.id} attempted to update graph ${id} with companyId ${cleanedGraph.companyId}, but belongs to ${userCompanyId}`);
            return c.json({ 
                error: 'Unauthorized: companyId does not match user\'s company context',
                code: 'COMPANY_MISMATCH' 
            }, 403);
        }

        if (cleanedGraph.userId !== auth.user.id) {
            console.warn(`Security violation: User ${auth.user.id} attempted to update graph ${id} with userId ${cleanedGraph.userId}`);
            return c.json({ 
                error: 'Unauthorized: userId does not match authenticated user',
                code: 'USER_MISMATCH' 
            }, 403);
        }

        // UpdateGraph mutation (no companyId/userId in input per GraphQL schema)
        const response = await graphqlSdk.UpdateGraph({
            id: id,                                    // Required as separate variable
            input: {
                id: id,                                  // Include ID in input for clarity, even if not required by schema
                name: cleanedGraph.name,
                description: cleanedGraph.description,
                graphType: cleanedGraph.graphType as any,
                nodes: cleanedGraph.nodes,
            }
        });

        if (response.errors) {
            console.error('UpdateGraph GraphQL errors:', response.errors);
            return c.json({ error: 'Failed to update graph', details: response.errors }, 500);
        }

        return c.json({ graph: response.data.updateGraph });

    } catch (error) {
        if (error instanceof v.ValiError) {
            return c.json({ error: 'Validation error', details: error.message }, 400);
        }
        console.error('Update graph error:', error);
        return c.json({ error: 'Failed to update graph' }, 500);
    }
});

/**
 * DELETE /api/public/v1/graph/crud/:id
 * Delete a graph from RAG system
 */
crudRoutes.delete('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const auth = c.get('auth');  // Add auth check

        // Resolve user's companyId for authorization
        const companyId = await getUserCompanyId(parseInt(auth.user.id));

        const response = await graphqlSdk.DeleteGraph({
            id: id,
            companyId: companyId,      // Required for auth
            userId: auth.user.id,       // Optional but good practice
        });

        if (response.errors) {
            console.error('DeleteGraph GraphQL errors:', response.errors);
            return c.json({ error: 'Failed to delete graph', details: response.errors }, 500);
        }

        // response.data.deleteGraph is explicit boolean
        if (!response.data.deleteGraph) {
            console.warn(`User ${auth.user.id} from company ${companyId} failed to delete graph ${id} - not found or restricted`);
            return c.json({ error: 'Graph could not be deleted (not found or restricted)' }, 404);
        }

        return c.json({ message: 'Graph deleted successfully' });

    } catch (error) {
        console.error('Delete graph error:', error);
        return c.json({ error: 'Failed to delete graph' }, 500);
    }
});

export default crudRoutes;
