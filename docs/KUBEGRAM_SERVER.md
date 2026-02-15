# Kubegram Server: Authentication & API Gateway Documentation

## Overview

Kubegram Server serves as the central orchestration layer between the frontend UI and the RAG system, providing authentication, API gateway functionality, and real-time communication services. Built on Bun.js with Hono framework, it handles session management, OAuth integrations, and acts as the primary interface for all frontend-to-backend operations.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend    │    │  Kubegram      │    │  PostgreSQL     │    │   KubeRAG      │
│   (React)      │◄──►│    Server        │◄──►│   (Database)    │◄──►│   (GraphQL)      │
│                 │    │                 │    │                 │    │                 │
│ • Auth UI      │    │ • Auth Layer   │    │ • Users         │    │ • LLM Workflows │
│ • Components   │    │ • API Gateway  │    │ • Companies     │    │ • RAG Engine    │
│ • Pages        │    │ • SSR          │    │ • Organizations │    │ • Code Gen       │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │              ┌────────┴────────┐              │
         │              │                 │              │
         ▼              ▼                 ▼              ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   OpenAuth      │ │   Redis        │ │   OAuth         │ │   File Storage  │
│   Providers     │ │                 │ │   Providers     │ │                 │
│                 │ │ • Sessions     │ │ • GitHub        │ │ • Static Files  │
│ • GitHub        │ │ • Cache        │ │ • Google        │ │ • Logs         │
│ • Google        │ │ • HA Mode      │ │ • GitLab        │ │                 │
│ • GitLab        │ │                 │ │ • Okta          │ │                 │
│ • Okta         │ └─────────────────┘ └─────────────────┘ └─────────────────┘
│                 │
└─────────────────┘
```

## Core Components

### 1. Authentication System

**Location**: `src/auth/openauth.ts`

The authentication system uses OpenAuth.js to provide multi-provider OAuth integration with database-backed session management and role-based access control.

#### Supported OAuth Providers
| Provider | Status | Configuration | Environment Variables |
|----------|--------|---------------|----------------------|
| **GitHub** | ✅ Full | OpenAuth Provider | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| **Google** | ✅ Full | OpenAuth Provider | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **GitLab** | ⚠️ Config | Slack Provider | `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET` |
| **Okta** | ✅ Custom | Custom Implementation | `OKTA_CLIENT_ID`, `OKTA_CLIENT_SECRET`, `OKTA_DOMAIN` |
| **Custom SSO** | ✅ Generic | OpenAuth Generic | Dynamic configuration |

#### Session Management
```typescript
// Session storage with Redis fallback
interface SessionData {
  subject: string;      // User email/identifier
  provider: string;    // OAuth provider
  expiresAt?: string;  // Session expiration
}

// L1 cache for fast lookups
const sessionCache = new LRUCache<string, AuthContext>({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5 minutes
});
```

**Session Lifecycle**:
1. **Creation**: After successful OAuth callback
2. **Validation**: On each protected request via middleware
3. **Expiration**: Automatic cleanup when `expiresAt` is reached
4. **HA Support**: Redis-based session sharing across instances

#### User Model & Roles
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

**Role Hierarchy**:
- **`admin`**: Full access to all resources and admin endpoints
- **`manager`**: Company and organization management
- **`team_member`**: Team-level access to projects and resources

#### Authentication Middleware

**Require Authentication** (`requireAuth`):
```typescript
import { requireAuth } from '@/middleware/auth';

app.get('/protected', requireAuth, async (c) => {
  const auth = await requireAuth(c);
  if (auth instanceof Response) return auth; // Error response
  
  // Use auth.user and auth.sessionId
  return c.json({ user: auth.user });
});
```

**Optional Authentication** (`optionalAuth`):
```typescript
app.get('/optional', optionalAuth, async (c) => {
  const auth = await optionalAuth(c);
  
  if (auth) {
    return c.json({ user: auth.user });
  } else {
    return c.json({ message: 'Anonymous access' });
  }
});
```

**Role-Based Access** (`requireRole`, `requireAnyRole`):
```typescript
// Admin-only endpoint
app.get('/admin', requireRole('admin'), async (c) => {
  // Only admin users can access
});

// Manager or team member access
app.get('/team', requireAnyRole(['manager', 'team_member']), async (c) => {
  // Both manager and team_member can access
});
```

### 2. API Gateway Layer

**Location**: `src/routes/`

Built on Hono.js framework providing modern HTTP routing with middleware support and TypeScript safety.

#### Route Structure
```
/api/
├── public/v1/           # Public API endpoints
│   ├── auth/           # Authentication endpoints
│   ├── companies/       # Company management
│   ├── organizations/   # Organization management
│   ├── teams/          # Team management
│   ├── users/          # User management
│   ├── projects/       # Project management
│   ├── certificates/   # Certificate management
│   ├── healthz/        # Health checks
│   ├── graph/          # Code generation & graph operations
│   └── iac/            # Infrastructure as Code
└── v1/admin/           # Admin-only endpoints
    └── oauth-config/   # OAuth provider configuration
```

#### Key Route Categories

**Authentication Routes** (`/api/public/v1/auth/`):
```typescript
// Current user session
GET /api/public/v1/auth/me

// Logout
POST /api/public/v1/auth/logout

// Available OAuth providers
GET /api/public/v1/auth/providers
```

**Resource Management Routes**:
- **Companies**: CRUD operations with owner/Admin permissions
- **Organizations**: Team-level organizational structure
- **Teams**: Working group management
- **Users**: User administration (admin only)
- **Projects**: Project lifecycle and metadata

**Code Generation Routes** (`/api/public/v1/graph/`):
```typescript
// Generate code from graph
POST /api/public/v1/graph/codegen

// Get code generation status
GET /api/public/v1/graph/codegen/:jobId

// Real-time WebSocket updates
WS /api/public/v1/graph/codegen/:jobId/subscribe
```

### 3. Database Layer

**Location**: `src/db/`

Uses Drizzle ORM with PostgreSQL for type-safe database operations and automated migrations.

#### Schema Design
```typescript
// Companies table - Top-level organizations
export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  tokens: integer('tokens').default(0),
  stripeCustomerID: text('stripe_customer_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Hierarchical structure: Companies → Organizations → Teams → Users
export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  companyId: uuid('company_id').references(() => companies.id),
  // ...
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  organizationId: integer('organization_id').references(() => organizations.id),
  // ...
});
```

**Key Tables**:
- `companies`: Top-level organizations with billing
- `organizations`: Company subdivisions
- `teams`: Working groups within organizations
- `users`: User accounts with roles and team assignments
- `projects`: Application projects with graph metadata
- `openauth_sessions`: User sessions with expiration
- `company_certificates`: Public key storage for API access

#### Migration Management
```bash
# Generate and apply migrations
bun x drizzle-kit push

# Custom migration generation
bun x drizzle-kit generate
```

### 4. RAG System Integration

**Location**: `src/clients/rag-client.ts`, `src/services/codegen.ts`

Provides seamless integration with KubeRAG GraphQL API for code generation and graph operations.

#### GraphQL Client Configuration
```typescript
export const graphqlConfig = {
  // HTTP endpoint for queries and mutations
  httpEndpoint: process.env.KUBERAG_URL || 'http://localhost:8665/graphql',
  // Default retry configuration for subscriptions
  retryAttempts: 5,
  retryDelay: 2000, // 2 seconds
};

// Singleton GraphQL SDK instance
export const graphqlSdk = GraphQL.createGraphQLSdk({
  endpoint: graphqlConfig.httpEndpoint,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
});
```

#### Code Generation Service
```typescript
export class CodegenService {
  private activeSubscriptions = new Map<string, WebSocketContext>();

  // Store/update project metadata with graph info
  async storeProjectMetadata(
    projectInfo: { id?: string; name?: string },
    graphData: any,
    userId: number,
    teamId: number
  ): Promise<any>

  // Handle WebSocket subscriptions for real-time updates
  async subscribeToJobUpdates(jobId: string, wsContext: WebSocketContext)

  // Submit code generation request to RAG system
  async submitCodeGeneration(input: ExtendedGenerateCodeInput)
}
```

#### Real-time Communication
```typescript
// WebSocket subscription for job updates
const subscription = await graphqlSdk.SubscribeToCodegenStatus({
  input: { jobId: 'job-123' }
});

// Handle real-time status updates
subscription.subscribe((data) => {
  console.log('Job status:', data.codegenJobStatus);
});
```

## Configuration Management

### Environment Variables

**Location**: `src/config/env.ts`

#### Core Application Settings
```bash
# Server Configuration
PORT=8090
NODE_ENV=development
APP_URL=http://localhost:8090
CORS_ORIGIN=http://localhost

# Database
DATABASE_URL=postgresql://localhost:5432/kubegram

# Redis (HA mode)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
ENABLE_HA=false
```

#### OAuth Provider Configuration
```bash
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

#### Security Configuration
```bash
# Global encryption for sensitive data
GLOBAL_ENCRYPTION_KEY=your-encryption-key

# JWT secret for session tokens
JWT_SECRET=your-jwt-secret
```

### Configuration Files

#### Development Configuration (`.env.development`)
```env
PORT=8090
NODE_ENV=development
CORS_ORIGIN=http://localhost
DATABASE_URL=postgresql://localhost:5432/kubegram_dev
ENABLE_HA=false
```

#### Production Configuration (`.env.production`)
```env
PORT=8090
NODE_ENV=production
CORS_ORIGIN=https://api.kubegram.local
DATABASE_URL=postgresql://prod-host:5432/kubegram_prod
ENABLE_HA=true
GLOBAL_ENCRYPTION_KEY=prod-encryption-key
JWT_SECRET=prod-jwt-secret
```

### CORS Configuration

#### Development Origins
- `http://localhost:3000` (React dev server)
- `http://localhost:5173` (Vite dev server)
- `http://localhost:8090` (Self-hosting)

#### Production Origins
- Single configured origin via `CORS_ORIGIN`
- Strict header validation
- Pre-flight request support

## API Reference

### Authentication Endpoints

#### OAuth Login Flow
```
GET /oauth/{provider}
```
Redirects to OAuth provider's authorization page.

**Parameters**: `provider` (path): `github` | `google` | `gitlab` | `okta`

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

**Response**: `200` with success message

### Resource Management Endpoints

#### Companies (`/api/public/v1/companies`)

| Method | Endpoint | Description | Auth | Access Control |
|--------|----------|-------------|------|----------------|
| `GET` | `/` | List all companies | Optional | Public (companies list) |
| `GET` | `/:id` | Get company by ID | Optional | Owner/Admin only |
| `POST` | `/` | Create new company | Required | Any authenticated user |
| `PUT` | `/:id` | Update company | Required | Owner/Admin only |
| `DELETE` | `/:id` | Delete company | Required | Owner/Admin only |

**Create Company Request**:
```json
{
  "name": "Example Corp",
  "tokens": 1000,
  "stripeCustomerID": "cus_123456"
}
```

**Kubernetes-Style Request** (IaC endpoints):
```json
{
  "apiVersion": "v1",
  "kind": "Company",
  "metadata": {
    "name": "engineering"
  },
  "spec": {
    "companyID": "uuid-value"
  }
}
```

#### Projects (`/api/public/v1/projects`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | List all projects | Optional |
| `GET` | `/:id` | Get project by ID | Optional | Team member access |
| `POST` | `/` | Create new project | Required | Authenticated user |
| `PUT` | `/:id` | Update project | Required | Team member access |
| `DELETE` | `/:id` | Delete project | Required | Project owner |

#### Code Generation (`/api/public/v1/graph`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/codegen` | Submit code generation job | Required |
| `GET` | `/codegen/:jobId` | Get job status | Required |
| `GET` | `/codegen/:jobId/result` | Get generated code | Required |
| `POST` | `/plan` | Submit planning job | Required |

**Code Generation Request**:
```json
{
  "input": {
    "modelProvider": "claude",
    "modelName": "claude-3-5-sonnet-20241022",
    "graph": {
      "nodes": [...],
      "edges": [...]
    }
  },
  "context": ["Production deployment with monitoring"],
  "companyId": "company-uuid",
  "userId": "user-uuid"
}
```

### Health Check Endpoints

#### Liveness Check
```
GET /api/public/v1/healthz/live
```
**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-30T12:00:00Z"
}
```

#### Readiness Check
```
GET /api/public/v1/healthz/ready
```
**Response**:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-30T12:00:00Z"
}
```

## Development & Deployment

### Local Development

#### Setup Process
```bash
# Clone repository
git clone https://github.com/kubegram/kubegram-server.git
cd kubegram-server

# Install dependencies
bun install

# Setup environment
cp .env.development .env

# Start development server
bun run dev
```

**Development Features**:
- Hot reloading with `--watch`
- Debug mode with `bun run dev:debug`
- TypeScript compilation on-the-fly
- Source maps for debugging

#### Development Scripts
```json
{
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "dev:debug": "bun --inspect=0.0.0.0:6464 --watch src/index.ts",
    "start": "NODE_ENV=production bun src/index.ts",
    "copy-ui": "chmod +x scripts/copy-ui.sh && ./scripts/copy-ui.sh",
    "db:clear": "./scripts/clear-database.sh",
    "db:restore": "./scripts/restore-database.sh",
    "db:backup": "./scripts/clear-database.sh --backup-only",
    "db:shell": "docker exec -it kubegram-server-postgres-1 psql -U postgres -d kubegram",
    "test": "bun test",
    "lint": "bunx eslint src",
    "typecheck": "bunx tsc --noEmit"
  }
}
```

### Docker Deployment

#### Development Docker
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build:
      context: .
      args:
        NODE_AUTH_TOKEN: ${NODE_AUTH_TOKEN}
    ports:
      - "8090:8090"
      - "6464:6464"
    command: >
      sh -c "
        echo 'Waiting for database to be ready...' &&
        sleep 10 &&
        echo 'Database should be ready, running migrations...' &&
        bun x drizzle-kit push --force &&
        echo 'Migrations completed, starting application...' &&
        bun run dev:debug
      "
    env_file:
      - .env.docker
    volumes:
      - ./src:/app/src
      - ./public:/app/public
```

#### Production Docker
```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock .npmrc ./
ARG NODE_AUTH_TOKEN
RUN bun install

COPY . .

EXPOSE 8090

CMD ["bun", "run", "dev"]
```

### Database Operations

#### Migration Management
```bash
# Generate migration files
bun x drizzle-kit generate

# Apply migrations to database
bun x drizzle-kit push

# Reset database (development only)
bun x drizzle-kit push --force
```

#### Backup & Restore
```bash
# Create database backup
bun run db:backup

# Restore from backup
bun run db:restore

# Clear all data
bun run db:clear
```

### Production Deployment

#### Environment Setup
```bash
# Set production environment
export NODE_ENV=production
export CORS_ORIGIN=https://api.kubegram.local
export DATABASE_URL=postgresql://prod-host:5432/kubegram_prod

# Start production server
bun run start
```

#### Health Monitoring
```bash
# Check server health
curl http://localhost:8090/api/public/v1/healthz/live

# Check database connectivity
curl http://localhost:8090/api/public/v1/healthz/ready
```

## Security Implementation

### Authentication Security

#### OAuth Configuration
```typescript
// Secure OAuth client setup
const openauthClient = createClient({
  clientID: "kubegram-web",
  issuer: config.appUrl,
});

// Provider-specific validation
const subjects = {
  user: v.object({
    id: v.string(),
    provider: v.string(),
  }),
};
```

#### Session Security
- **HTTP-only Cookies**: Prevents XSS attacks
- **Secure Cookies**: HTTPS-only in production
- **Signed Sessions**: Cryptographic integrity
- **Expiration Handling**: Automatic session cleanup

### API Security

#### Input Validation
```typescript
// Schema-based validation with valibot
const requestSchema = v.object({
  name: v.string().minLength(1).maxLength(100),
  email: v.string().email(),
  role: v.enum(['admin', 'manager', 'team_member']),
});
```

#### SQL Injection Prevention
- **ORM Usage**: Drizzle parameterized queries
- **No Raw SQL**: All database access through ORM
- **Type Safety**: Compile-time query validation

### CORS Security

#### Development Configuration
```typescript
const corsMiddleware = cors({
  origin: (origin, c) => {
    // Allow localhost origins in development
    if (origin && origin.startsWith('http://localhost')) {
      return origin;
    }
    return config.corsOrigin;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
});
```

#### Production Configuration
```typescript
const corsMiddleware = cors({
  origin: config.corsOrigin, // Single production origin
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
});
```

## Performance & Scalability

### Caching Strategy

#### Redis Integration
```typescript
// Session caching with Redis backup
const redisStorage = new RedisLruStorage({
  redis: redisClient,
  keyPrefix: 'session:',
  ttl: 86400, // 24 hours
});

// Hybrid storage: L1 cache (memory) + L2 cache (Redis)
const sessionCache = new LRUCache<string, AuthContext>({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5 minutes
});
```

#### Database Optimization
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Indexed columns for common queries
- **Pagination**: Large dataset handling
- **Soft Deletes**: Data preservation with performance

### Real-time Features

#### WebSocket Subscriptions
```typescript
// Real-time code generation updates
class SubscriptionManager {
  private activeSubscriptions = new Map<string, WebSocketContext>();

  async subscribeToJobUpdates(jobId: string, wsContext: WebSocketContext) {
    this.activeSubscriptions.set(jobId, wsContext);
    
    // Set up message handlers
    wsContext.on('message', (data) => {
      this.handleJobStatusUpdate(jobId, data);
    });
  }
}
```

## Error Handling & Monitoring

### Error Response Format
```typescript
// Standardized error responses
interface ErrorResponse {
  error: string;           // Human-readable error message
  code: string;            // Machine-readable error code
  timestamp: string;        // Error occurrence time
  details?: any;            // Additional error context
}

// Success response format
interface SuccessResponse<T> {
  data: T;                // Response payload
  timestamp: string;        // Response time
  message?: string;         // Optional success message
}
```

### Logging Strategy
```typescript
// Structured logging with different levels
logger.info('User authenticated', { 
  userId: user.id, 
  provider: user.provider,
  sessionId: sessionId 
});

logger.error('Database operation failed', { 
  error: error.message,
  query: sql,
  userId: context.userId 
});

logger.debug('Request processing', {
  method: request.method,
  path: request.path,
  userAgent: request.headers.get('user-agent')
});
```

### Health Monitoring
```typescript
// Comprehensive health checks
const healthCheck = {
  status: 'ok',
  timestamp: new Date().toISOString(),
  services: {
    database: await checkDatabaseHealth(),
    redis: await checkRedisHealth(),
    kubegram: await checkKubegramHealth(),
  },
  version: process.env.npm_package_version,
};
```

## Testing Strategy

### Unit Testing
```typescript
// Authentication middleware testing
describe('Authentication Middleware', () => {
  it('should authenticate valid session', async () => {
    const mockContext = createMockContext();
    const auth = await requireAuth(mockContext);
    
    expect(auth).not.toBeInstanceOf(Response);
    expect(auth.user.email).toBe('user@example.com');
  });

  it('should reject invalid session', async () => {
    const mockContext = createMockContext();
    const auth = await requireAuth(mockContext);
    
    expect(auth).toBeInstanceOf(Response);
    expect(auth.status).toBe(401);
  });
});
```

### Integration Testing
```typescript
// Database integration testing
describe('Database Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  it('should create and retrieve company', async () => {
    const company = await createTestCompany();
    const retrieved = await db.select()
      .from(companies)
      .where(eq(companies.id, company.id))
      .limit(1);
    
    expect(retrieved[0]).toMatchObject(company);
  });
});
```

### API Testing
```typescript
// Endpoint integration testing
describe('Companies API', () => {
  it('POST /api/public/v1/companies', async () => {
    const response = await app.request('/api/public/v1/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Company' })
    });
    
    expect(response.status).toBe(201);
    expect(response.data.name).toBe('Test Company');
  });
});
```

## Best Practices

### Code Organization
```
src/
├── auth/              # Authentication system
│   ├── openauth.ts   # OAuth implementation
│   └── ui.tsx       # Auth UI components
├── clients/           # External service clients
│   └── rag-client.ts # KubeRAG GraphQL client
├── config/            # Configuration management
│   ├── env.ts        # Environment variables
│   └── secrets.ts    # Secret management
├── db/               # Database layer
│   ├── index.ts      # Database connection
│   └── schema.ts     # Table definitions
├── middleware/         # Request processing
│   ├── auth.ts       # Authentication guards
│   └── cors.ts       # CORS handling
├── routes/            # API routes
│   ├── api/         # Route definitions
│   └── api.ts       # Route aggregation
├── services/          # Business logic
│   ├── codegen.ts    # Code generation logic
│   └── oauth.ts      # OAuth service layer
└── utils/            # Utility functions
    ├── logger.ts     # Structured logging
    ├── retry.ts      # Retry logic
    └── ...           # Other utilities
```

### Security Best Practices
1. **Input Validation**: Schema-based validation for all inputs
2. **Authentication**: Multi-factor session validation
3. **Authorization**: Role-based access control
4. **Data Protection**: Encryption for sensitive data
5. **API Security**: Rate limiting, CORS, headers

### Performance Best Practices
1. **Caching**: Redis-backed session caching
2. **Database**: Connection pooling, query optimization
3. **Real-time**: WebSocket for live updates
4. **Monitoring**: Comprehensive health checks
5. **Error Handling**: Graceful degradation and logging

## Troubleshooting

### Common Issues

#### Authentication Problems
1. **OAuth Callback Failures**:
   - Verify client ID and secret
   - Check redirect URI configuration
   - Review provider settings

2. **Session Issues**:
   - Clear Redis cache if corrupted
   - Check session expiration
   - Verify cookie domain/path

#### Database Connection Issues
1. **Connection Refused**:
   - Verify PostgreSQL is running
   - Check connection string format
   - Network connectivity testing

2. **Migration Failures**:
   - Reset database with `bun run db:reset`
   - Check migration file permissions
   - Review SQL syntax

#### CORS Errors
1. **Development**: Ensure client runs on localhost
2. **Production**: Verify `CORS_ORIGIN` matches client domain
3. **Pre-flight**: Check OPTIONS request handling

### Debug Mode

#### Enable Debug Logging
```bash
# Set debug environment
export NODE_ENV=development
export LOG_LEVEL=debug

# Start with debugging
bun run dev:debug
```

#### Database Debugging
```bash
# Connect to database
bun run db:shell

# Check connection
docker exec -it kubegram-server-postgres-1 psql -U postgres -d kubegram
```

---

Kubegram Server serves as the critical orchestration layer in the Kubegram platform, providing secure authentication, comprehensive API management, and seamless integration between the frontend UI and the RAG code generation system.