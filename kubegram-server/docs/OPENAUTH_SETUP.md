# OpenAuth Integration Guide

This backend now uses OpenAuth for authentication, providing a modern, standards-based OAuth implementation.

## What's Been Set Up

### ✅ OpenAuth Dependencies
- `@openauthjs/openauth` - Main OpenAuth library
- `valibot` - Schema validation
- `hono` - Web framework support

### ✅ Authentication Providers
- GitHub OAuth
- Google OAuth  
- Password provider (configurable)

### ✅ Database Schema Updates
- `openauth_sessions` - Stores user sessions and tokens
- `openauth_codes` - OAuth flow authorization codes
- Relations to existing users table

### ✅ Server Integration
- OpenAuth middleware integrated into Bun server
- OAuth routes available at `/oauth/*`
- Updated auth API endpoints

### ✅ Client Configuration
- Frontend client utilities in `src/auth/client.ts`
- Helper functions for auth flow, token management

## Environment Configuration

Update your `.env.development` or production environment variables:

```bash
# OpenAuth Configuration
APP_URL=http://localhost:8090
JWT_SECRET=your-secret-key-change-in-production

# GitHub OAuth (create at https://github.com/settings/applications/new)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth (create at https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## API Endpoints

### OpenAuth Routes
- `GET /oauth/github` - Start GitHub OAuth flow
- `GET /oauth/google` - Start Google OAuth flow
- `GET /oauth/*` - OpenAuth handles callback and token exchange

### Application Auth Routes
- `GET /api/public/v1/auth/me` - Get current authenticated user
- `GET /api/public/v1/auth/providers` - List available OAuth providers
- `POST /api/public/v1/auth/logout` - Logout current user

## Frontend Integration

Use the client utilities in `src/auth/client.ts`:

```javascript
import { redirectToProvider, handleAuthCallback, getCurrentUser } from '@/auth/client'

// Start OAuth flow
await redirectToProvider('github')

// Handle OAuth callback
const tokens = await handleAuthCallback(code, state)

// Get current user
const user = await getCurrentUser()
```

## Migration

Run the database migration to create OpenAuth tables:

```bash
# Generate migration (already done)
bunx drizzle-kit generate

# Apply migration to database
bunx drizzle-kit push
```

## Next Steps

1. **Set up OAuth Apps**: Create GitHub and Google OAuth applications
2. **Update Environment**: Add your OAuth credentials to `.env.development`
3. **Run Migration**: Apply database schema changes
4. **Test Integration**: Verify OAuth flow works end-to-end
5. **Frontend Integration**: Use client utilities in your frontend app

## Security Notes

- Store OAuth credentials securely (use secrets management in production)
- The `JWT_SECRET` should be a strong, random string
- Consider using HTTPS in production for OAuth callbacks
- Review token expiration and refresh policies