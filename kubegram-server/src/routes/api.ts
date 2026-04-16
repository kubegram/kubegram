// This file is deprecated - routes are now handled by Hono in the new structure
// Keeping this file for reference during migration cleanup

export async function handleApiRoutes(_request: Request): Promise<Response | null> {
    console.warn('handleApiRoutes is deprecated - using new Hono routes instead');
    return null;
}