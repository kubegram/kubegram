import { Hono } from 'hono';

const app = new Hono();

// GET /status
app.get('/status', (c) => {
    const isReleased = process.env.IS_RELEASED === 'true';
    return c.json({
        status: isReleased ? 'RELEASED' : 'NOT_RELEASED'
    });
});

export default app;