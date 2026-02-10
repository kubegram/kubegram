# KubeRAG: TypeScript + Bun Migration

> **Current Status**: Python to TypeScript/Bun migration in progress
> 
> **Debugging**: 🚀 Full Docker debugging support implemented (see [Debugging Guide](.vscode/DEBUGGING.md))

## 🚀 Quick Start

### Production Docker Setup
```bash
# Start with production build
docker compose up app

# Start with hot reload for development  
docker compose --profile dev up app-dev
```

### VS Code Debugging
1. Open **Run and Debug** (Ctrl+Shift+D)
2. Choose one of the debug configurations:
   - **🐳 Docker: Web Debugger Instructions** (Recommended)
   - **🐳 Docker: Attach Bun Extension**
   - **🐳 Docker: Attach Node.js Debugger**
   - **Bun: Launch API** (Local development)

### Quick Debugging Workflow
```bash
# Start container with debugging
docker compose up app

# Get web debugger URL from logs or run:
node .vscode/web-debugger-instructions.js

# Open the debug.bun.sh URL in your browser
```

## 🏗️ Architecture

### Current Stack
- **Runtime**: Bun 1.1.34 (TypeScript native)
- **Framework**: Hono (lightweight HTTP server)
- **GraphQL**: graphql-yoga + Pothos schema builder
- **Database**: Dgraph (graph DB + vector search)
- **Cache**: Redis (cache + pub/sub + checkpointer)
- **LLM**: Vercel AI SDK (Claude, OpenAI, Google, DeepSeek, Ollama)
- **Workflow**: Custom state machine (4 nodes + retry)

### Migration Progress
- ✅ Phase 1: Project foundation (types, config)
- ✅ Phase 2: Infrastructure clients (Dgraph, Redis)
- ✅ Phase 3: LLM + RAG + Prompts  
- ✅ Phase 4: Codegen workflow
- ✅ Phase 5: Services layer
- ✅ Phase 6: GraphQL API layer
- ✅ Phase 7: Docker & Infrastructure
- ✅ Phase 8: Testing & Debugging
- 🔄 Phase 9: Documentation & validation (in progress)

## 📋 Development Commands

### Docker Development
```bash
# Production mode (compiled)
docker compose up app --build

# Development mode (hot reload)
docker compose --profile dev up app-dev --build

# Show logs
docker compose logs -f app
docker compose logs -f app-dev

# Stop all services
docker compose down
```

### Local Development
```bash
# Install dependencies
bun install

# Local debugging
bun --inspect src/index.ts

# Run tests
bun test

# Type checking
bun run typecheck
```

### VS Code Tasks
Open **Terminal > Run Task** for quick actions:
- 🐳 Start Docker App with Debug
- 🐳 Start Docker App-Dev (Hot Reload)  
- 🐳 Show Docker Logs
- 🔧 Show Web Debugger Instructions
- 🔧 Test Debugging Port
- 🔧 Check Container Status

## 🔧 Debugging

### Web Debugger (Recommended)
1. Start container: `docker compose up app`
2. Look for "Bun Inspector" output in logs
3. Open the `debug.bun.sh` URL in Chrome/Safari
4. Set breakpoints and debug in browser

### VS Code Debugging
- **Bun Extension**: Use official Bun extension from Oven
- **Node.js Debugger**: Works with source mapping
- **Local Debugging**: Use "Bun: Launch API" config

**📖 Complete debugging guide**: [.vscode/DEBUGGING.md](.vscode/DEBUGGING.md)

## 🏛️ Project Structure

```
kuberag-ts/
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript configuration
├── docker-compose.yml           # Docker services
├── Dockerfile                   # Production build
├── Dockerfile.dev               # Development (hot reload)
├── .vscode/
│   ├── launch.json              # Debug configurations
│   ├── tasks.json               # VS Code tasks
│   ├── DEBUGGING.md             # Debugging guide
│   └── web-debugger-instructions.js
├── src/
│   ├── index.ts                 # Hono app + GraphQL
│   ├── config.ts                # Environment config
│   ├── types/                   # TypeScript interfaces
│   ├── graphql/                 # Schema + resolvers
│   ├── db/                      # Dgraph client
│   ├── services/                # Business logic
│   ├── workflows/               # Codegen state machine
│   ├── state/                   # Redis utilities
│   ├── llm/                     # LLM providers
│   ├── rag/                     # Embeddings + context
│   ├── prompts/                 # System + node prompts
│   └── utils/                   # Helper functions
└── tests/
    ├── unit/                    # Unit tests
    ├── integration/             # Integration tests
    └── e2e/                     # End-to-end tests
```

## 🧪 Testing

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Watch mode
bun test --watch
```

## 📚 Documentation

- [Debugging Guide](.vscode/DEBUGGING.md) - Comprehensive debugging setup
- [Migration Plan](CLAUDE.md) - Detailed Python→TS migration strategy  
- [API Documentation](./docs/api.md) - GraphQL schema documentation
- [Deployment Guide](./docs/deployment.md) - Production deployment

## 🐛 Troubleshooting

### Debugging Issues
- **VS Code can't attach**: Use Web Debugger instead
- **Breakpoints not working**: Check source map paths
- **WebSocket connection failed**: Verify port 9229 is exposed

### Docker Issues
```bash
# Reset everything
docker compose down --volumes --remove-orphans
docker compose up --build

# Check container status
docker compose ps
docker compose logs app
```

For more troubleshooting, see [Debugging Guide](.vscode/DEBUGGING.md#troubleshooting).

## 🤝 Development Workflow

1. **Setup**: Clone and run `docker compose up app`
2. **Debug**: Use Web Debugger or VS Code configurations  
3. **Test**: `bun test` after changes
4. **Validate**: `docker compose down && docker compose up --build`
5. **Deploy**: Production Docker image ready for deployment

---

**Note**: This is a TypeScript migration of the Python FastAPI KubeRAG application. The original Python codebase has been streamlined, removing dead code paths while maintaining full API compatibility and functionality.