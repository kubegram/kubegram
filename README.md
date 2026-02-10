# Kubegram Unified Docker Setup

This repository contains a unified Docker Compose configuration for running both KubeRAG and Kubegram Server services with shared infrastructure.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│  Kubegram Server│    │     KubeRAG     │
│   (Port 8090)   │    │   (Port 8665)   │
│                 │    │                 │
│  PostgreSQL     │    │     Dgraph      │
│  Redis DB 1     │    │  Redis DB 0     │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌─────────────────┐
         │  Shared Redis   │
         │   (Port 6379)   │
         └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Make (optional, for convenience commands)
- Environment variables configured (see Configuration section)

### 1. Start All Services
```bash
make up
# or
docker-compose up -d
```

### 2. Verify Services
```bash
make health-check
```

### 3. Access Services
- **Kubegram Server**: http://localhost:8090
- **KubeRAG GraphQL**: http://localhost:8665/graphql
- **Dgraph Console**: http://localhost:8080
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6379

## 📋 Service Details

### Kubegram Server
- **Port**: 8090 (external), 8090 (internal)
- **Purpose**: Main API server with authentication and CRUD operations
- **Database**: PostgreSQL (kubegram)
- **Redis**: Shared instance, DB 1
- **Dependencies**: PostgreSQL, Redis, KubeRAG

### KubeRAG
- **Port**: 8665 (external), 8665 (internal)
- **Purpose**: GraphQL API for infrastructure graph management and code generation
- **Database**: Dgraph
- **Redis**: Shared instance, DB 0
- **Dependencies**: Redis, Dgraph

### Shared Infrastructure
- **Redis**: Single instance serving both services
  - KubeRAG uses DB 0
  - Kubegram Server uses DB 1
- **Network**: All services communicate via `kubegram-network`

## ⚙️ Configuration

### Environment Variables

#### KubeRAG (`./kuberag/.env.docker`)
```env
# Core Configuration
PORT=8665
NODE_ENV=development
ENABLE_CORS=true

# Dgraph
DGRAPH_HOST=dgraph
DGRAPH_HTTP_PORT=8080

# Redis (shared)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# LLM Providers (optional)
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key
GOOGLE_API_KEY=your_key
DEEPSEEK_API_KEY=your_key

# Schema Loading Control (KubeRAG - optional)
SKIP_SCHEMA_LOAD=false
SCHEMA_LOAD_INTERVAL=60
SCHEMA_LOAD_MAX_ATTEMPTS=0
```

#### Kubegram Server (`./kubegram-server/.env.docker`)
```env
# Core Configuration
PORT=8090
NODE_ENV=development
CORS_ORIGIN=http://localhost

# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/kubegram

# Redis (shared)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=1

# KubeRAG Service
KUBERAG_URL=http://kuberag:8665/graphql

# OAuth Providers
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 🛠️ Management Commands

### Using Make (Recommended)
```bash
# Start services
make up

# Stop services
make down

# View logs
make logs

# View specific service logs
make logs-kuberag
make logs-kubegram
make logs-redis

# Check service status
make status

# Rebuild everything
make rebuild

# Clean up volumes
make clean

# Access service shells
make shell-kuberag
make shell-kubegram
make shell-redis

# Database operations
make db-migrate
make db-reset

# Redis operations
make redis-cli
make redis-flush

# Health check
make health-check
```

### Using Docker Compose Directly
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Execute commands
docker-compose exec kubegram-server /bin/sh
docker-compose exec kuberag /bin/sh
docker-compose exec redis redis-cli
```

## 🔍 Development Workflow

### 1. Making Changes
Both services mount their source directories for hot reloading:
- KubeRAG: `./kuberag/src` → `/app/src`
- Kubegram Server: `./kubegram-server/src` → `/app/src`

### 2. Debugging
Both services expose debug ports:
- KubeRAG: 9229
- Kubegram Server: 6464

### 3. Database Operations
```bash
# Run migrations
make db-migrate

# Reset database
make db-reset

# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d kubegram
```

### 4. Redis Operations
```bash
# Access Redis CLI
make redis-cli

# Switch between databases
redis-cli -n 0  # KubeRAG data
redis-cli -n 1  # Kubegram Server data

# Clear specific database
redis-cli -n 0 FLUSHDB  # Clear KubeRAG data
redis-cli -n 1 FLUSHDB  # Clear Kubegram Server data
```

### 5. Schema Loading Control (KubeRAG)
```bash
# Skip schema loading for faster development startup
SKIP_SCHEMA_LOAD=true make up

# Custom retry interval (seconds)
SCHEMA_LOAD_INTERVAL=30 make up

# Limit retry attempts (0=infinite)
SCHEMA_LOAD_MAX_ATTEMPTS=5 make up

# Example: Skip schema loading and set custom retry
SKIP_SCHEMA_LOAD=true SCHEMA_LOAD_INTERVAL=30 SCHEMA_LOAD_MAX_ATTEMPTS=3 make up
```

## 🐛 Troubleshooting

### Common Issues

#### Port Conflicts
- Ensure ports 8090, 8665, 5432, 6379, 8080 are available
- Check with `lsof -i :<port>` on macOS/Linux

#### Service Dependencies
- Kubegram Server waits for KubeRAG to be healthy
- Both services wait for Redis to be healthy
- Use `make status` to check service states

#### Database Connection Issues
```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Check Redis
docker-compose exec redis redis-cli ping

# Check Dgraph
curl http://localhost:8080/admin
```

#### Volume Issues
```bash
# Clean up and restart
make clean
make up
```

### Health Checks
```bash
# Comprehensive health check
make health-check

# Individual service checks
curl http://localhost:8090/api/public/v1/healthz/live  # Kubegram Server
curl http://localhost:8665/health                       # KubeRAG
```

## 📊 Monitoring

### Service Logs
```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f kubegram-server
```

### Resource Usage
```bash
# Check container stats
docker stats

# Check disk usage
docker system df
```

## 🔄 Production Considerations

For production deployment:

1. **Environment Variables**: Use production values, set `NODE_ENV=production`
2. **Resource Limits**: Add memory/CPU limits to docker-compose.yml
3. **Security**: Remove debug ports, use proper secrets management
4. **Persistence**: Ensure volumes are properly backed up
5. **Networking**: Consider using external networks for security

## 📚 Additional Documentation

- [KubeRAG Documentation](./kuberag/README.md)
- [Kubegram Server Documentation](./kubegram-server/README.md)
- [Kubegram Server API Docs](./kubegram-server/docs/api_docs.md)
- [Kubegram Server Auth Setup](./kubegram-server/docs/OPENAUTH_SETUP.md)