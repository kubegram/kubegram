import { cors } from 'hono/cors';
import config from '../config/env';

// Only allow localhost origins in development/local environment
export const corsMiddleware = cors({
    origin: config.isDevelopment
        ? (origin) => origin // Allow any origin
        : config.corsOrigin,
    allowMethods: config.isDevelopment ? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'] : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: config.isDevelopment ? ['*'] : ['Content-Type', 'Authorization'],
    credentials: true,
});

// Legacy exports for compatibility during migration
export interface CorsOptions {
    origin: string | string[];
    methods: string[];
    credentials: boolean;
}

export const corsOptions: CorsOptions = {
    origin: config.isDevelopment
        ? '*'
        : config.corsOrigin,
    methods: config.isDevelopment ? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'] : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
};

export function setCorsHeaders(headers: Headers, origin?: string | null): Headers {
    // Determine if origin is allowed
    let allowedOrigin = '';

    if (config.isDevelopment && origin) {
        // In development, allow any origin
        allowedOrigin = origin;
    } else if (config.isProduction && origin) {
        // In production, only allow the configured CORS origin
        if (origin === config.corsOrigin) {
            allowedOrigin = origin;
        }
    }

    if (allowedOrigin) {
        headers.set('Access-Control-Allow-Origin', allowedOrigin);
        headers.set('Access-Control-Allow-Methods', config.isDevelopment ? 'GET, POST, PUT, DELETE, OPTIONS, PATCH' : corsOptions.methods.join(', '));
        headers.set('Access-Control-Allow-Headers', config.isDevelopment ? '*' : 'Content-Type, Authorization');
        headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return headers;
}

export function handleCorsPreFlight(request: Request): Response | null {
    if (request.method === 'OPTIONS') {
        const headers = new Headers();
        setCorsHeaders(headers, request.headers.get('Origin'));
        return new Response(null, { status: 204, headers });
    }
    return null;
}
