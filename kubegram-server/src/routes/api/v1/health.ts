import { Hono } from 'hono';

const app = new Hono();

// GET /healthz/live
app.get('/live', (c) => {
    return c.json({ status: 'ok' });
});

// GET /healthz/ready
app.get('/ready', (c) => {
    // Check DB connection here ideally
    return c.json({ status: 'ready' });
});

export default app;