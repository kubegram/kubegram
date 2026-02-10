# Kubegram Server v2 - Agents Documentation

**Version**: 2.0  
**Base URL**: `http://localhost:8090`

This document provides comprehensive information for agents and developers working with the Kubegram Server v2 authentication system, API endpoints, and runtime configuration.

## 🔐 Authentication System

### Overview

Kubegram Server v2 uses **OpenAuth.js** as its primary authentication framework with multi-provider OAuth support and database-backed session management.

### Supported OAuth Providers

| Provider | Status | Flow | Configuration |
|----------|--------|------|---------------|
| **GitHub** | ✅ Full | OpenAuth Provider | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| **Google** | ✅ Full | OpenAuth Provider | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **GitLab** | ⚠️ Config | SlackProvider (fix needed) | `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET` |
| **Okta** | ✅ Custom | Custom Implementation | `OKTA_CLIENT_ID`, `OKTA_CLIENT_SECRET`, `OKTA_DOMAIN` |
| **Custom SSO** | ✅ Generic | OpenAuth Generic | Dynamic configuration |

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant Server
    participant OAuthProvider
    participant Database

    User->>Client: Initiate OAuth
    Client->>Server: GET /oauth/{provider}
    Server->>OAuthProvider: Redirect to provider
    OAuthProvider->>User: Authorization prompt
    User->>OAuthProvider: Grant access
    OAuthProvider->>Server: Callback with code
    Server->>OAuthProvider: Exchange code for token
    Server->>Database: Store session
    Server->>Client: Set session cookie
    Client->>User: Authenticated session
```

### Session Management

#### Session Storage
- **Location**: Database `openauth_sessions` table
- **Cookie**: HTTP-only session cookie named `session`
- **Expiration**: Configurable with automatic cleanup
- **Subject**: Email-based user identification

#### Session Lifecycle
1. **Creation**: After successful OAuth callback
2. **Validation**: On each protected request via middleware
3. **Expiration**: Automatic cleanup when `expiresAt` is reached
4. **Cleanup**: Manual logout or automatic expiration

### User Model & Roles

```typescript
interface UserSubject {
  id: string;          // Database user ID
  email: string;       // Primary identifier
  name: string;        // Display name
  avatar?: string;     // Avatar URL
  role?: string;       // admin | manager | team_member
  teamId?: string;     // Team assignment
}
```

#### Role Hierarchy
- **`admin`**: Full access to all resources and admin endpoints
- **`manager`**: Company and organization management
- **`team_member`**: Team-level access to projects and resources

### Authentication Middleware

#### `requireAuth(c: Context)`
Enforces authentication on protected routes.

```typescript
import { requireAuth } from '@/middleware/auth';

app.get('/protected', requireAuth, async (c) => {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth; // Error response
  
  // Use auth.user and auth.sessionId
  return c.json({ user: auth.user });
});
```

**Returns**: 
- `AuthContext` on success
- `401 Response` if no session, invalid session, or session expired
- `500 Response` on database errors

#### `optionalAuth(c: Context)`
Optional authentication - returns `null` if no session.

```typescript
app.get('/optional', async (c) => {
  const auth = await optionalAuth(c);
  
  if (auth) {
    return c.json({ user: auth.user });
  } else {
    return c.json({ message: 'Anonymous access' });
  }
});
```

#### `requireRole(requiredRole: string)`
Enforces specific role requirements with admin override.

```typescript
import { requireRole } from '@/middleware/auth';

// Admin-only endpoint
app.get('/admin', requireRole('admin'), async (c) => {
  const auth = c.get('auth');
  // Only admin users can access
});
```

**Role Access**:
- Required role users ✅
- Admin users ✅ (override)
- Other roles ❌ (403 Forbidden)

#### `requireAnyRole(roles: string[])`
Accepts any role from provided list with admin override.

```typescript
import { requireAnyRole } from '@/middleware/auth';

// Manager or team member access
app.get('/team', requireAnyRole(['manager', 'team_member']), async (c) => {
  const auth = c.get('auth');
  // Both manager and team_member can access
});
```

### Authentication Endpoints

#### OAuth Login
```
GET /oauth/{provider}
```
Redirects to OAuth provider's authorization page.

**Parameters**:
- `provider` (path): `github` | `google` | `gitlab` | `okta`

**Response**: `302` redirect to provider

#### OAuth Callback
```
GET /oauth/{provider}/callback
```
Handles OAuth provider callback, creates session, and redirects to frontend.

**Parameters**:
- `provider` (path): OAuth provider
- `code` (query): Authorization code
- `state` (query): State parameter

**Response**: `302` redirect to frontend

#### Current Session
```
GET /api/public/v1/auth/me
```
Gets current user session information.

**Authentication**: Required

**Response**:
```json
{
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "role": "team_member",
    "teamId": "456"
  },
  "sessionId": "session_abc123"
}
```

#### Logout
```
POST /api/public/v1/auth/logout
```
Clears current session and removes cookie.

**Authentication**: Required

**Response**: `200` with success message

#### Available Providers
```
GET /api/public/v1/auth/providers
```
Lists configured OAuth providers.

**Response**:
```json
{
  "providers": [
    { "name": "github", "displayName": "GitHub", "configured": true },
    { "name": "google", "displayName": "Google", "configured": true },
    { "name": "gitlab", "displayName": "GitLab", "configured": false }
  ]
}
```

## 🛣️ API Routes Reference

### Base URLs

- **Development**: `http://localhost:8090`
- **Production**: Configured via `APP_URL` environment variable

### Route Structure

```
/api/
├── public/v1/           # Public API endpoints
│   ├── companies/       # Company management
│   ├── organizations/   # Organization management
│   ├── teams/          # Team management
│   ├── users/          # User management
│   ├── projects/       # Project management
│   ├── certificates/   # Certificate management
│   ├── auth/           # Authentication endpoints
│   ├── healthz/        # Health checks
│   └── iac/            # Infrastructure as Code
└── v1/admin/           # Admin-only endpoints
    └── oauth-config/   # OAuth provider configuration
```

### Public v1 API Endpoints

#### Companies (`/api/public/v1/companies`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | List all companies | Optional |
| `GET` | `/:id` | Get company by ID | Optional |
| `POST` | `/` | Create new company | Required |
| `PUT` | `/:id` | Update company | Required |
| `DELETE` | `/:id` | Delete company | Required (Owner/Admin) |

**Create Company Request**:
```json
{
  "name": "Example Corp",
  "tokens": 1000,
  "stripeCustomerID": "cus_123456"
}
```

#### Organizations (`/api/public/v1/organizations`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | List all organizations | Optional |
| `GET` | `/:id` | Get organization by ID | Optional |
| `POST` | `/` | Create new organization | Required |
| `PUT` | `/:id` | Update organization | Required |
| `DELETE` | `/:id` | Delete organization | Required (Manager/Admin) |

#### Teams (`/api/public/v1/teams`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | List all teams | Optional |
| `GET` | `/:id` | Get team by ID | Optional |
| `POST` | `/` | Create new team | Required |
| `PUT` | `/:id` | Update team | Required |
| `DELETE` | `/:id` | Delete team | Required (Manager/Admin) |

#### Users (`/api/public/v1/users`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | List all users | Required |
| `POST` | `/` | Create new user | Required |

#### Projects (`/api/public/v1/projects`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | List all projects | Optional |
| `GET` | `/:id` | Get project by ID | Optional |
| `POST` | `/` | Create new project | Required |
| `PUT` | `/:id` | Update project | Required |
| `DELETE` | `/:id` | Delete project | Required |

#### Certificates (`/api/public/v1/certificates`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/upload` | Upload public key | Required |
| `POST` | `/generate` | Generate key pair | Required |

**Upload Certificate Request**:
```json
{
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
  "label": "Production API Key"
}
```

**Generate Key Pair Response**:
```json
{
  "id": "cert_123456",
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n..."
}
```

#### Infrastructure as Code (`/api/public/v1/iac`)

Kubernetes-style resource endpoints for CRD and Terraform integration.

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/organizations` | Create organization (K8s style) | Required |
| `PUT` | `/organizations/:id` | Update organization (K8s style) | Required |
| `DELETE` | `/organizations/:id` | Delete organization (K8s style) | Required |
| `POST` | `/teams` | Create team (K8s style) | Required |
| `PUT` | `/teams/:id` | Update team (K8s style) | Required |
| `DELETE` | `/teams/:id` | Delete team (K8s style) | Required |

**Kubernetes-style Request**:
```json
{
  "apiVersion": "v1",
  "kind": "Organization",
  "metadata": {
    "name": "engineering"
  },
  "spec": {
    "companyID": 123
  }
}
```

#### Health Checks (`/api/public/v1/healthz`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/live` | Liveness probe | None |
| `GET` | `/ready` | Readiness probe | None |

**Liveness Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-30T12:00:00Z"
}
```

**Readiness Response**:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-30T12:00:00Z"
}
```

### Admin API v1 Endpoints (`/api/v1/admin/)

#### OAuth Configuration (`/api/v1/admin/oauth-config`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Create/update OAuth config | Admin |
| `GET` | `/:provider` | Get OAuth provider config | Admin |

**OAuth Config Request**:
```json
{
  "provider": "github",
  "clientId": "ghp_123456",
  "clientSecret": "ghs_789012",
  "enabled": true
}
```

## 🚀 Application Runtime

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Bun.js | Latest | JavaScript runtime |
| **Framework** | Hono.js | ^4.11.7 | HTTP routing |
| **Database** | PostgreSQL | - | Data persistence |
| **ORM** | Drizzle ORM | ^0.45.1 | Database queries |
| **Auth** | OpenAuth.js | ^0.4.3 | OAuth authentication |
| **Language** | TypeScript | - | Type safety |

### Server Startup

#### Development Mode
```bash
bun run dev
```

**Features**:
- Hot reloading with `--watch`
- Default port: `8090`
- Environment: `development`
- CORS: Allows all localhost origins

#### Production Mode
```bash
bun run start
```

**Features**:
- Optimized runtime
- Environment: `production`
- Strict CORS policy
- Static file serving enabled

### Application Entry Point

**File**: `src/index.ts`

#### Startup Sequence

1. **Configuration Loading**
   ```typescript
   import config from './config/env';
   console.log(`🚀 Starting Kubegram Server in ${config.nodeEnv} mode`);
   ```

2. **Middleware Chain Setup**
   ```typescript
   const honoApp = new Hono();
   honoApp.use('*', corsMiddleware);
   honoApp.route('/oauth', app); // OpenAuth routes
   ```

3. **Static File Serving**
   ```typescript
   honoApp.use('/assets/*', serveStatic({ root: './public' }));
   honoApp.use('*.js', serveStatic({ root: './public' }));
   // ... other static file types
   ```

4. **API Routes Mounting**
   ```typescript
   honoApp.route('/api', apiRoutes);
   ```

5. **SSR Fallback**
   ```typescript
   honoApp.get('*', renderSSR);
   ```

6. **Server Launch**
   ```typescript
   const server = serve({
     fetch: honoApp.fetch,
     port: config.port,
     error(error) {
       console.error('Server error:', error);
       return new Response('Internal Server Error', { status: 500 });
     },
   });
   ```

### Static File Serving

#### Supported File Types
- JavaScript (`.js`)
- CSS (`.css`)
- Images (`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.ico`)
- Fonts (`.woff`, `.woff2`, `.ttf`, `.eot`)

#### File Structure
```
public/
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
├── index.html
└── favicon.ico
```

#### UI Build Integration
```bash
bun run copy-ui
```

Copies React app build from `../kubegram-ui-v2/dist` to `./public`

### Database Configuration

#### Connection Setup
```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
```

#### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `companies` | Top-level organizations | `id`, `name`, `tokens`, `stripeCustomerID` |
| `organizations` | Company subdivisions | `id`, `name`, `companyId` |
| `teams` | Working groups | `id`, `name`, `organizationId` |
| `users` | User accounts | `id`, `email`, `role`, `teamId` |
| `projects` | Application projects | `id`, `name`, `graphMetadata` |
| `openauth_sessions` | User sessions | `id`, `subject`, `expiresAt` |
| `company_certificates` | Public keys | `id`, `publicKey`, `label`, `companyId` |

## ⚙️ Configuration Management

### Environment Variables

#### Core Application
```env
# Server Configuration
PORT=8090
NODE_ENV=development
APP_URL=http://localhost:8090
CORS_ORIGIN=http://localhost

# Database
DATABASE_URL=postgresql://localhost:5432/kubegram

# Authentication
JWT_SECRET=your-secret-key-change-in-production
```

#### OAuth Providers
```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitLab OAuth
GITLAB_CLIENT_ID=your_gitlab_client_id
GITLAB_CLIENT_SECRET=your_gitlab_client_secret

# Okta OAuth
OKTA_CLIENT_ID=your_okta_client_id
OKTA_CLIENT_SECRET=your_okta_client_secret
OKTA_DOMAIN=your-company.okta.com
```

### Configuration Files

#### `.env.development`
```env
PORT=8090
NODE_ENV=development
CORS_ORIGIN=http://localhost
DATABASE_URL=postgresql://localhost:5432/kubegram_dev
```

#### `.env.production`
```env
PORT=8090
NODE_ENV=production
CORS_ORIGIN=https://api.kubegram.local
DATABASE_URL=postgresql://prod-host:5432/kubegram_prod
```

### CORS Configuration

#### Development Origins
- `http://localhost:3000` (React dev server)
- `http://localhost:5173` (Vite dev server)
- `http://localhost:8090` (This server)

#### Production
- Single configured origin via `CORS_ORIGIN`
- Strict header validation
- Pre-flight request support

## 🔒 Security Patterns

### Authentication Usage Examples

#### Protected Route Pattern
```typescript
import { requireAuth } from '@/middleware/auth';
import type { AuthContext } from '@/middleware/auth';

app.get('/api/protected-data', async (c) => {
  // Authenticate user
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth;

  // Use user context for access control
  const userCompanyId = auth.user.teamId;
  
  // Query only resources user can access
  const resources = await db.select()
    .from(resources)
    .where(eq(resources.companyId, userCompanyId));

  return c.json({ resources });
});
```

#### Role-Based Access Pattern
```typescript
import { requireRole, requireAnyRole } from '@/middleware/auth';

// Admin-only functionality
app.post('/api/admin/reset-system', requireRole('admin'), async (c) => {
  // System administration logic
});

// Manager or higher access
app.get('/api/company/billing', requireAnyRole(['manager', 'admin']), async (c) => {
  // Billing information access
});
```

### Session Security

#### Session Validation
- Database-backed session storage
- Automatic expiration cleanup
- HTTP-only session cookies
- Session binding to user email

#### Access Control
- Company isolation via foreign keys
- Role-based endpoint protection
- User team membership enforcement

### Error Handling Patterns

#### Authentication Errors
```typescript
// Missing session
{
  "error": "No session found"
}

// Invalid/expired session
{
  "error": "Session expired"
}

// Insufficient permissions
{
  "error": "Insufficient permissions"
}
```

#### API Response Format
```typescript
// Success response
{
  "data": { /* response data */ },
  "timestamp": "2026-01-30T12:00:00Z"
}

// Error response
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2026-01-30T12:00:00Z"
}
```

## 📝 Integration Examples for Agents

### Authentication Integration

#### Initialize Agent with Authentication
```typescript
import { createGraphQLSubscriptionClient } from '@/clients/rag-client';

class KubegramAgent {
  private sessionId: string;
  private userId: string;

  constructor(sessionCookie: string) {
    this.sessionId = sessionCookie;
  }

  async authenticate() {
    const response = await fetch('/api/public/v1/auth/me', {
      headers: { 'Cookie': `session=${this.sessionId}` }
    });
    
    const { user, sessionId } = await response.json();
    this.userId = user.id;
    return { user, sessionId };
  }

  createAuthenticatedClient() {
    return createGraphQLSubscriptionClient({
      connectionParams: {
        sessionId: this.sessionId,
        userId: this.userId
      }
    });
  }
}
```

### API Usage Examples

#### Company Resource Management
```typescript
class CompanyManager {
  async createCompany(companyData: any) {
    const response = await fetch('/api/public/v1/companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${this.sessionId}`
      },
      body: JSON.stringify(companyData)
    });

    if (response.status === 401) {
      throw new Error('Authentication required');
    }

    return response.json();
  }

  async getCompanies() {
    const response = await fetch('/api/public/v1/companies');
    return response.json();
  }
}
```

#### Infrastructure as Code Integration
```typescript
class InfrastructureManager {
  async createK8sOrganization(orgData: any) {
    const k8sStyleData = {
      apiVersion: "v1",
      kind: "Organization",
      metadata: { name: orgData.name },
      spec: { companyID: orgData.companyId }
    };

    const response = await fetch('/api/public/v1/iac/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${this.sessionId}`
      },
      body: JSON.stringify(k8sStyleData)
    });

    return response.json();
  }
}
```

### Long-Running Process Handling

#### Session Renewal Pattern
```typescript
class SessionManager {
  private sessionExpiry: Date | null = null;

  async ensureValidSession() {
    if (!this.sessionExpiry || new Date() >= this.sessionExpiry) {
      const response = await fetch('/api/public/v1/auth/me', {
        headers: { 'Cookie': `session=${this.sessionId}` }
      });

      if (response.status === 401) {
        throw new Error('Session expired, please re-authenticate');
      }

      // Session is valid, extend local expiry time
      this.sessionExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
  }

  async executeWithAuth<T>(operation: () => Promise<T>): Promise<T> {
    await this.ensureValidSession();
    return operation();
  }
}
```

## 🐛 Troubleshooting

### Common Issues

#### Authentication Failures
1. **Session not found**: User needs to re-authenticate
2. **Session expired**: Automatic cleanup occurred
3. **User not found**: Database user record missing

#### CORS Errors
1. **Development**: Ensure client runs on localhost
2. **Production**: Check `CORS_ORIGIN` configuration
3. **Pre-flight**: Verify OPTIONS requests are allowed

#### Database Connection Issues
1. **Connection string**: Check `DATABASE_URL` format
2. **Network**: Verify database connectivity
3. **Schema**: Run pending migrations with `drizzle-kit push`

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
LOG_LEVEL=debug
```

### Health Monitoring

#### Liveness Check
```bash
curl http://localhost:8090/api/public/v1/healthz/live
```

#### Readiness Check
```bash
curl http://localhost:8090/api/public/v1/healthz/ready
```

---

This documentation provides the complete reference for agents and developers working with Kubegram Server v2's authentication system, API endpoints, and runtime configuration.