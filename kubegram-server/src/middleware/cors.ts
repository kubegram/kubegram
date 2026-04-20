import { cors } from 'hono/cors';
import config from '../config/env';

// Only allow localhost origins in development/local environment or self-serve mode
const isPermissiveCors = config.isDevelopment || config.isSelfServe;

// Common headers allowed in permissive mode (can't use * with credentials: true)
const permissiveHeaders = ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'];

export const corsMiddleware = cors({
    origin: isPermissiveCors
        ? (origin) => origin // Allow any origin
        : config.corsOrigin,
    allowMethods: isPermissiveCors ? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'] : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: isPermissiveCors ? permissiveHeaders : ['Content-Type', 'Authorization'],
    credentials: true,
});

// Legacy exports for compatibility during migration
export interface CorsOptions {
    origin: string | string[];
    methods: string[];
    credentials: boolean;
}

export const corsOptions: CorsOptions = {
    origin: isPermissiveCors
        ? '*'
        : config.corsOrigin,
    methods: isPermissiveCors ? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'] : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
};

export function setCorsHeaders(headers: Headers, origin?: string | null): Headers {
    // Determine if origin is allowed
    let allowedOrigin = '';

    if (isPermissiveCors && origin) {
        // In development or self-serve mode, allow any origin
        allowedOrigin = origin;
    } else if (config.isProduction && origin) {
        // In production, only allow the configured CORS origin
        if (origin === config.corsOrigin) {
            allowedOrigin = origin;
        }
    }

    if (allowedOrigin) {
        headers.set('Access-Control-Allow-Origin', allowedOrigin);
        headers.set('Access-Control-Allow-Methods', isPermissiveCors ? 'GET, POST, PUT, DELETE, OPTIONS, PATCH' : corsOptions.methods.join(', '));
        headers.set('Access-Control-Allow-Headers', isPermissiveCors ? permissiveHeaders.join(', ') : 'Content-Type, Authorization');
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
