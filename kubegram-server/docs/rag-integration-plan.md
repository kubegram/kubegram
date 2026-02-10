# RAG Integration Implementation Plan

**Version**: 1.0  
**Date**: 2026-01-30  
**Status**: Planning Complete

This document provides a comprehensive implementation plan for integrating Kubegram RAG system with kubegram-server-v2 backend for code generation functionality.

## 🎯 **Overview**

The RAG integration will enable users to generate Kubernetes and infrastructure configurations from graph-based representations through real-time communication with the Kubegram RAG system using GraphQL mutations and subscriptions.

## 🏗️ **Architecture**

### **Technology Stack**
- **Runtime**: Bun.js with TypeScript
- **Framework**: Hono.js for API routing
- **Database**: PostgreSQL with Drizzle ORM
- **GraphQL**: @kubegram/common-ts for RAG communication
- **Authentication**: OpenAuth.js with team-based permissions
- **Validation**: Valibot for input validation

### **Data Flow**
```
Frontend → REST API → Service Layer → GraphQL RAG System
    ↓           ↓              ↓              ↓
Auth Check → Permission Validation → Job Creation → Real-time Updates
```

## 📊 **Database Schema Design**

### **Leverage Existing Infrastructure**

#### **Existing `projects` Table**
No changes needed - leverages existing structure:
- `id`, `name`, `graphId`, `graphMeta` (JSON)
- Standard timestamps + soft delete
- **Add**: `teamId` (FK to teams) and `createdBy` (FK to users)

#### **Updated `generation_jobs` Table**
Track code generation jobs with dual ID tracking:
- `id`, `uuid` 
- `graphId` (TEXT) - RAG system graph ID (from UI/RAG)
- `projectId` (INTEGER, FK to projects) - For permissions
- `requestedBy` (FK to users)
- `status` (pending|running|completed|failed|cancelled)
- `config` (JSON - generation configuration)
- `resultData` (JSON - generated files)
- `errorMessage`, `progress`
- Job lifecycle timestamps

#### **generation_job_artifacts** (Optional)
Store generated files and assets:
- `id`, `jobId`, `type` (file|directory|metadata)
- `name`, `content`, `storageUrl`
- `size`, `checksum`, `timestamp`

### **Permission Model**
- **Project-based ownership**: Projects belong to teams, users belong to teams
- **Automatic access**: Team members have full access to team projects
- **Graph context**: Projects contain graph metadata in `graphMeta` field
- **Cross-team collaboration**: Optional project-level collaborators

## 🔧 **API Endpoints**

### **POST /api/public/v1/graph/codegen**
Initialize code generation for a graph

**Request:**
```typescript
{
  graph: {
    name: string;
    description?: string;
    graphType: 'KUBERNETES' | 'INFRASTRUCTURE' | 'ABSTRACT' | 'DEBUGGING' | 'MICROSERVICE';
    companyId: string;
    userId: string;
    nodes: GraphNode[];
    bridges?: GraphBridge[];
  },
  project: {
    id?: string;           // Optional - for existing project
    name?: string;         // Optional - for new project
    description?: string;    // Optional
    teamId: string;        // Required - for permissions
  },
  llmConfig?: {
    provider?: 'CLAUDE' | 'GEMMA' | 'DEEPSEEK' | 'OPENAI' | 'GOOGLE';
    model?: string;
  }
}
```

**Response:**
```typescript
{
  jobId: string;
  step: string;
  status: string;
}
```

### **GET /api/public/v1/graph/codegen/:jobId/status**
Get current status of code generation job
- Returns job progress, status, and error information
- Validates user permissions for job access

### **WebSocket /api/public/v1/graph/codegen/:jobId/subscribe**
Real-time updates for code generation progress
- Upgrades HTTP connection to WebSocket
- Streams updates from GraphQL subscription
- Handles connection drops and reconnections

## 🚨 **Error Handling**

### **CodegenError Class**
```typescript
class CodegenError extends Error {
  graph: GraphQL.Graph;
  isServerError: boolean;
  retryable: boolean;
  attempt: number;
}
```

### **Retry Strategy**
- **3 retry attempts** for server-side errors
- **Exponential backoff** within 2-minute window
- **Server error detection**: 5xx HTTP errors, network/timeout patterns
- **Automatic fallback**: Non-retryable errors fail immediately

## 🔄 **Real-time Communication**

### **WebSocket Architecture**
- **Hono WebSocket integration** for connection management
- **GraphQL subscription client** from @kubegram/common-ts
- **Job isolation**: Each WebSocket handles single job
- **Connection cleanup**: Automatic unsubscribe on disconnect

### **Subscription Flow**
1. Client connects to WebSocket endpoint
2. Server validates job permissions
3. Server creates GraphQL subscription with RAG system
4. Data flows: RAG → Server → Client in real-time
5. Automatic cleanup on completion/disconnect

### **Update Format**
```typescript
{
  type: 'update' | 'error' | 'complete',
  data?: GeneratedCodeGraph,
  error?: string
}
```

## 🔐 **Authentication & Security**

### **Permission Validation**
- **Team membership check**: Users must be team members to access team projects
- **Job ownership validation**: Only users with team access can view job status
- **Session-based auth**: Using existing OpenAuth.js middleware
- **Role inheritance**: Admin access for all resources in scope

### **Security Measures**
- **Input validation**: Valibot schemas for all API inputs
- **SQL injection prevention**: Drizzle ORM parameterized queries
- **Rate limiting**: Not implemented (as per requirements)
- **CORS protection**: Existing middleware configuration

## 📈 **Performance & Scalability**

### **Database Optimizations**
- **Strategic indexes** on frequently queried fields
- **Soft deletes** for data retention and performance
- **JSON storage** for flexible metadata
- **Connection pooling** via existing Drizzle configuration

### **GraphQL Optimizations**
- **Subscription reuse** via factory pattern
- **Connection limits** to prevent resource exhaustion
- **Error boundaries** for resilient subscriptions
- **Retry mechanisms** for network resilience

## 🗂️ **File Structure**

```
src/
├── routes/api/v1/graph/
│   ├── index.ts          # Route aggregator with auth middleware
│   ├── codegen.ts        # Code generation endpoints
│   └── types.ts          # API types and validation schemas
├── services/
│   ├── codegen.ts        # Code generation business logic
│   └── permissions.ts    # Team permission validation
├── errors/
│   └── codegen.ts        # Custom CodegenError class
├── utils/
│   └── retry.ts           # Retry utility functions
└── db/
    └── schema.ts          # Updated with new tables
```

## 🚀 **Implementation Steps**

### **Phase 1: Database Setup**
1. Add `teamId` and `createdBy` to `projects` table
2. Create `generation_jobs` table with dual ID tracking
3. Run migration and verify schema
4. Add database indexes for performance

### **Phase 2: Core Services**
1. Implement `CodegenService` class
2. Add `GraphPermissions` validation
3. Create `CodegenError` with retry logic
4. Add retry utility functions

### **Phase 3: API Endpoints**
1. Create route files in `src/routes/api/v1/graph/`
2. Implement Hono-based endpoints with project context
3. Add Valibot validation schemas
4. Register routes in API router

### **Phase 4: WebSocket Integration**
1. Implement WebSocket upgrade logic
2. Add GraphQL subscription management
3. Handle connection lifecycle
4. Add real-time update broadcasting

### **Phase 5: Integration & Testing**
1. Connect all components together
2. Test complete workflow
3. Verify error handling
4. Performance testing and optimization

## 🧪 **Testing Strategy**

### **Unit Tests**
- Service layer functions
- Permission validation logic
- Error handling and retry logic
- Input validation schemas

### **Integration Tests**
- Complete API endpoint workflows
- WebSocket connection management
- Database operations
- GraphQL client interactions

### **End-to-End Tests**
- Full code generation workflow
- Real-time update streaming
- Connection drop/recovery scenarios
- Multi-client concurrent access

## 📊 **Monitoring & Observability**

### **Key Metrics**
- Code generation request volume
- Job completion rates and times
- WebSocket connection counts
- Error rates by type
- Database query performance

### **Logging Strategy**
- Structured logging with correlation IDs
- Request/response logging (filtered)
- WebSocket lifecycle events
- GraphQL interaction tracking

## 🔄 **Dependencies & Integration**

### **Existing Dependencies**
- `@kubegram/common-ts` - GraphQL types and client
- `hono` - API framework
- `drizzle-orm` - Database layer
- `valibot` - Input validation
- `@openauthjs/openauth` - Authentication

### **External Services**
- **RAG System**: GraphQL endpoint at `KUBERAG_URL`
- **Database**: PostgreSQL connection via `DATABASE_URL`
- **WebSocket**: RAG WebSocket at `KUBERAG_WS`

## ⚙️ **Configuration**

### **Environment Variables**
```env
# RAG System Configuration
KUBERAG_URL=http://localhost:8090/graphql
KUBERAG_WS=ws://localhost:8090/graphql

# Existing configuration (unchanged)
DATABASE_URL=postgresql://localhost:5432/kubegram
PORT=8090
NODE_ENV=development
```

### **Default Settings**
- **LLM Provider**: Claude (CLAUDE) if not specified
- **Retry Attempts**: 3 for server errors
- **Retry Window**: 2 minutes maximum
- **WebSocket Timeout**: Default connection settings

## 🎯 **Success Criteria**

- ✅ Users can store graph metadata with project ownership
- ✅ Code generation initiated via REST API with project context
- ✅ Real-time updates delivered via WebSocket
- ✅ Team-based permission validation enforced
- ✅ Robust error handling with retries
- ✅ Complete audit trail of generation jobs
- ✅ Seamless integration with existing authentication
- ✅ Type-safe implementation throughout
- ✅ Leverages existing projects table and graphMeta field

## 🔄 **Future Enhancements**

### **Potential Features**
- **Job Queuing**: Handle concurrent generation requests
- **Artifact Storage**: External storage for large generated files
- **Template Library**: Reusable project templates
- **Collaborative Editing**: Real-time project collaboration
- **Analytics Dashboard**: Usage metrics and insights

### **Performance Improvements**
- **Caching**: Cache frequent project lookups
- **Background Processing**: Async job processing
- **Database Sharding**: Scale for large deployments
- **CDN Integration**: Static file delivery

---

**Status**: Planning complete, ready for implementation  
**Next**: Begin Phase 1 database setup and proceed with implementation phases