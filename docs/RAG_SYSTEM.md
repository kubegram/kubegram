# KubeRAG: RAG System Summary for AI Coding Agents

## Overview

KubeRAG is the Retrieval-Augmented Generation (RAG) engine that powers Kubegram's AI coding capabilities. It combines graph-based infrastructure modeling with vector similarity search and multi-provider LLM integration to generate production-ready Kubernetes manifests from visual architectural inputs.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GraphQL API   │    │   RAG Engine    │    │  LLM Providers  │
│                 │◄──►│                 │◄──►│                 │
│ • Resolvers     │    │ • Context       │    │ • Claude        │
│ • Schema Types  │    │ • Embeddings    │    │ • OpenAI        │
│ • Mutations     │    │ • Prompts       │    │ • Gemini        │
└─────────────────┘    └─────────────────┘    │ • DeepSeek      │
         │                       │              │ • Ollama        │
         │                       │              └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dgraph DB     │    │   Redis Cache   │    │   Workflows     │
│                 │    │                 │    │                 │
│ • Graph Store   │    │ • Checkpointing │    │ • Codegen       │
│ • Vector Search │    │ • Pub/Sub       │    │ • Planning      │
│ • Metadata      │    │ • Job Cache     │    │ • State Machine │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Components

### 1. RAG Context Service (`src/rag/context.ts`)

**Purpose**: Retrieves similar infrastructure graphs to provide context for LLM code generation.

**Key Features**:
- **Vector Similarity Search**: Uses Dgraph's HNSW vector search to find similar graphs
- **Embedding Strategy**: Prefers graph-level contextEmbedding, falls back to node embedding averaging
- **Context Building**: Formats similar graphs into structured context for LLM prompts
- **Multi-level Filtering**: Supports company-level filtering for contextual relevance

**Key Methods**:
```typescript
// Main RAG context retrieval
getRAGContext(graph: Graph, topK: number = 3, companyId?: string): Promise<RAGContext>

// Node-specific context for fine-grained patterns
getNodeContext(nodeType: string, limit: number = 5): Promise<NodeContext>

// Connection pattern analysis
getConnectionContext(sourceType: string, targetType: string): Promise<ConnectionContext>
```

**Output Structure**:
```typescript
interface RAGContext {
  similarGraphs: Graph[];
  contextText: string;        // Formatted for LLM prompt
  avgEmbedding?: number[];    // Search embedding used
  searchPerformed: boolean;
}
```

### 2. Embeddings Service (`src/rag/embeddings.ts`)

**Purpose**: Generates vector embeddings for graph similarity search with automatic fallback.

**Providers**:
- **Primary**: Voyage AI (voyage-code-2 model, 1536 dimensions)
- **Fallback**: Local @xenova/transformers (all-MiniLM-L6-v2, 384 dimensions)

**Key Features**:
- **Automatic Fallback**: Seamlessly switches from Voyage AI to local embeddings
- **Batch Processing**: Efficient handling of multiple texts
- **Timeout Protection**: 30-second timeout for API calls
- **Provider Testing**: Built-in health checks and validation

**Usage Examples**:
```typescript
// Generate embeddings with automatic provider selection
const embeddings = await embeddingsService.embed(texts);

// Force local provider usage
const localEmbeddings = await embeddingsService.embed(texts, true);

// Get provider information
const info = embeddingsService.getProviderInfo();
// Returns: { preferred: 'voyage-code-2', available: [...], dimensions: 1536 }
```

### 3. System Prompt Builder (`src/prompts/system.ts`)

**Purpose**: Constructs comprehensive LLM prompts that combine Kubernetes best practices with RAG context.

**Prompt Components**:
- **Kubernetes Best Practices**: API versions, labels, resource management
- **Security Guidelines**: Container security, RBAC, network policies
- **Resource Limits**: CPU/memory guidelines by service type
- **RAG Context**: Similar infrastructure examples
- **Graph Context**: Node types, namespaces, metadata
- **Output Format**: Structured JSON response requirements

**Key Methods**:
```typescript
// Full prompt with all components
buildSystemPrompt(graph: Graph, ragContext?: RAGContext, config?: SystemPromptConfig)

// Minimal prompt for simple cases
buildMinimalPrompt(): string

// Node-specific prompt generation
buildNodeSpecificPrompt(node: GraphNode, ragContext?: RAGContext): string
```

**Output Format**:
```json
{
  "manifests": [{
    "file_name": "deployment.yaml",
    "generated_code": "apiVersion: apps/v1\nkind: Deployment\n...",
    "assumptions": ["Application is stateless"],
    "decisions": ["Used RollingUpdate strategy"],
    "entity_name": "my-app",
    "entity_id": "node-123",
    "entity_type": "MICROSERVICE"
  }]
}
```

### 4. LLM Provider Factory (`src/llm/providers.ts`)

**Purpose**: Unified interface for multiple LLM providers using Vercel AI SDK.

**Supported Providers**:
- **Claude**: Anthropic API (Claude 3.5 Sonnet, Haiku)
- **OpenAI**: GPT models (GPT-4, GPT-3.5-turbo)
- **Google Gemini**: Gemini Pro models
- **DeepSeek**: DeepSeek API models
- **Ollama**: Local models (Gemma, Llama, Mistral)

**Configuration**:
```typescript
interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}
```

**Usage**:
```typescript
// Get provider instance
const provider = LLMProviderFactory.getProvider(ModelProvider.claude, {
  temperature: 0.1,
  maxTokens: 4000
});

// Generate text
const result = await generateText({
  model: provider,
  prompt: systemPrompt,
  temperature: 0.1
});
```

### 5. Workflow Engine

#### Code Generation Workflow (`src/workflows/codegen-workflow.ts`)

**4-Step Process**:
1. **getOrCreateGraph**: Fetch/create graph in Dgraph with embeddings
2. **getPrompt**: Generate node-specific prompts with RAG context
3. **llmCall**: Invoke LLM with system prompt + user requirements
4. **validateConfigurations**: Validate generated YAML manifests

**State Management**:
```typescript
interface CodegenState {
  graph: Graph;
  ragContext?: RAGContext;
  systemPrompt?: string;
  llmResponse?: string;
  generatedManifests?: GeneratedCodeGraph;
  validationErrors?: ValidationError[];
  workflowMessages: WorkflowMessage[];
}
```

#### Planning Workflow (`src/workflows/plan-workflow.ts`)

**Purpose**: High-level infrastructure planning and analysis.

**Process**:
1. Analyze user requirements
2. Generate infrastructure plan
3. Validate feasibility
4. Provide recommendations

### 6. State Management

#### Redis Integration (`src/state/`)
- **Cache**: Job results and frequently accessed data
- **Pub/Sub**: Real-time workflow updates
- **Checkpointer**: Workflow state persistence and recovery

#### Database Integration (`src/db/client.ts`)

**Dgraph HTTP/GraphQL Client**:
- **Graph Operations**: CRUD for infrastructure graphs
- **Vector Search**: HNSW-based similarity queries
- **Metadata Management**: Company, user, project associations

**Key Queries**:
```typescript
// Search similar graphs by embedding
searchSimilarGraphsByEmbedding(embedding: number[], topK: number, companyId?: string)

// Graph CRUD operations
getGraph(id: string): Promise<Graph>
createGraph(input: GraphInput): Promise<Graph>
updateGraph(id: string, input: GraphInput): Promise<Graph>
```

## GraphQL API Schema

### Main Types

```graphql
type Graph {
  id: ID!
  name: String!
  description: String
  graphType: GraphType!
  companyId: String!
  userId: String!
  nodes: [GraphNode!]!
  contextEmbedding: [Float!]  # Vector embedding
  createdAt: DateTime!
  updatedAt: DateTime!
}

type GraphNode {
  id: ID!
  name: String!
  nodeType: GraphNodeType!
  namespace: String
  embedding: [Float!]  # Node-specific embedding
  properties: JSON
}

type GeneratedCodeGraph {
  id: ID!
  graphId: String!
  manifests: [GeneratedManifest!]!
  assumptions: [String!]!
  decisions: [String!]!
  createdAt: DateTime!
}

type GeneratedManifest {
  fileName: String!
  generatedCode: String!
  assumptions: [String!]!
  decisions: [String!]!
  entityName: String!
  entityId: String!
  entityType: String!
}
```

### Key Mutations

```graphql
# Submit code generation job
mutation submitCodegenJob($input: CodegenJobInput!) {
  submitCodegenJob(input: $input) {
    jobId
    status
  }
}

# Submit planning job
mutation submitPlanJob($input: PlanJobInput!) {
  submitPlanJob(input: $input) {
    jobId
    status
  }
}
```

### Key Queries

```graphql
# Get job status
query getJobStatus($jobId: ID!) {
  getJobStatus(jobId: $jobId) {
    jobId
    status
    step
    error
    result
  }
}

# Get generated code
query getGeneratedCode($graphId: ID!) {
  getGeneratedCode(graphId: $graphId) {
    manifests {
      fileName
      generatedCode
      assumptions
      decisions
    }
  }
}
```

## Configuration

### Environment Variables

```bash
# Database
DGRAPH_HOST=localhost
DGRAPH_HTTP_PORT=8080

# Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# LLM Providers
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key
GOOGLE_API_KEY=your_key
DEEPSEEK_API_KEY=your_key
OLLAMA_BASE_URL=http://localhost:11434

# Embeddings
VOYAGE_API_KEY=your_key

# Server
PORT=8665
ENABLE_CORS=true
NODE_ENV=development
```

### Model Configuration

```typescript
// Supported models mapping
const VALID_MODELS = {
  claude: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
  openai: ['gpt-4', 'gpt-3.5-turbo'],
  google: ['gemini-1.5-pro', 'gemini-1.5-flash'],
  deepseek: ['deepseek-chat', 'deepseek-coder'],
  ollama: ['gemma2:9b', 'llama3.1:8b', 'mistral:7b']
};
```

## Development Patterns

### 1. Adding New LLM Providers

```typescript
// 1. Add to types/enums.ts
enum ModelProvider {
  // ... existing
  newprovider = 'newprovider'
}

// 2. Add case in LLMProviderFactory.getProvider()
case ModelProvider.newprovider:
  instance = this.createNewProvider(config);
  break;

// 3. Update configuration validation
const envSchema = z.object({
  // ... existing
  NEW_PROVIDER_API_KEY: z.string().optional(),
});
```

### 2. Extending RAG Context

```typescript
// Add new context type in RAGContextService
async getCustomContext(input: CustomInput): Promise<CustomContext> {
  // Implement custom logic
  return { context: data, text: formatted };
}

// Integrate into SystemPromptBuilder
buildCustomPrompt(graph: Graph, customContext?: CustomContext): string {
  let prompt = this.buildBasePrompt();
  
  if (customContext?.contextText) {
    prompt += customContext.contextText;
  }
  
  return prompt;
}
```

### 3. Adding New Workflow Steps

```typescript
// 1. Add step to WorkflowStep enum
enum WorkflowStep {
  // ... existing
  CUSTOM_STEP = 'customStep'
}

// 2. Implement step handler in workflow class
private async handleCustomStep(state: CodegenState): Promise<CodegenState> {
  // Step implementation
  return state;
}

// 3. Add to steps array
protected readonly steps = [
  // ... existing
  WorkflowStep.CUSTOM_STEP
];
```

## Performance Considerations

### 1. Embedding Caching
- Graph-level embeddings are precomputed and stored in Dgraph
- Node embeddings are cached to avoid recomputation
- LRU cache for frequently accessed embeddings

### 2. Vector Search Optimization
- HNSW index in Dgraph for fast approximate nearest neighbor search
- Top-K parameter tuning for relevance vs. performance trade-off
- Company-scoped searches to reduce candidate set

### 3. LLM Provider Management
- Provider instances are cached and reused
- Automatic failover between providers
- Timeout protection and retry logic

### 4. State Management
- Redis checkpointing for workflow recovery
- Pub/sub for real-time status updates
- Background job processing with Redis queues

## Error Handling

### 1. Provider Failures
```typescript
try {
  const embeddings = await voyageProvider.embed(texts);
} catch (error) {
  console.warn('Voyage AI failed, falling back to local:', error);
  const embeddings = await localProvider.embed(texts);
}
```

### 2. Workflow Recovery
```typescript
// Checkpoint recovery
const savedState = await checkpointer.load(jobId);
if (savedState) {
  state = { ...state, ...savedState };
} else {
  state = createInitialCodegenState(input);
}
```

### 3. GraphQL Error Handling
```typescript
export class DgraphError extends Error {
  constructor(
    message: string,
    public readonly errors?: Array<{ message: string }>,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'DgraphError';
  }
}
```

## Testing Strategies

### 1. Unit Testing
- Provider mocking for LLM calls
- Vector similarity validation
- Prompt building verification

### 2. Integration Testing
- End-to-end workflow testing
- GraphQL schema validation
- Redis/Dgraph integration

### 3. Performance Testing
- Embedding generation benchmarks
- Vector search performance under load
- Concurrent workflow execution

## Security Considerations

### 1. API Key Management
- Environment-based configuration
- No hardcoded credentials
- Provider-specific authentication

### 2. Data Isolation
- Company-scoped graph access
- User-based authorization
- Row-level security in Dgraph

### 3. Input Validation
- GraphQL schema validation
- Prompt injection protection
- Rate limiting for LLM calls

## Monitoring and Observability

### 1. Logging Strategy
```typescript
// Structured logging
console.debug(`Generated ${embeddings.length} embeddings using ${provider.getModelName()}`);
console.info(`RAG context built from ${similarGraphs.length} similar graphs`);
console.error('LLM call failed:', { error, provider, model });
```

### 2. Metrics Collection
- Embedding generation latency
- LLM provider success rates
- Vector search performance
- Workflow completion times

### 3. Health Checks
```typescript
// Provider health validation
async test(): Promise<boolean> {
  try {
    const testEmbedding = await this.embedSingle("test");
    return testEmbedding.length > 0;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
```

## Best Practices for Coding Agents

### 1. When Using RAG Context
- Always check if `searchPerformed` is true before using context
- Validate that embeddings are available before similarity search
- Use company-scoped searches for better relevance

### 2. When Working with LLMs
- Use appropriate temperature settings (0.1-0.3 for code generation)
- Set reasonable timeout values (30-60 seconds)
- Implement proper error handling with fallback options

### 3. When Managing Workflows
- Always checkpoint state after significant steps
- Use pub/sub for real-time status updates
- Implement retry logic for transient failures

### 4. When Storing Data
- Precompute graph-level embeddings when possible
- Cache frequently accessed data in Redis
- Use appropriate TTL for cached values

## Integration Examples

### 1. Basic Code Generation
```typescript
const graph = await dgraphClient.getGraph(graphId);
const ragContext = await ragContextService.getRAGContext(graph, 3, companyId);
const systemPrompt = buildSystemPrompt(graph, ragContext);
const llmProvider = LLMProviderFactory.getProvider(ModelProvider.claude);

const result = await generateText({
  model: llmProvider,
  prompt: systemPrompt,
  temperature: 0.1
});

const manifests = parseLLMManifestsOutput(result.text);
```

### 2. Workflow Job Submission
```typescript
const jobId = await codegenService.submitCodegenJob({
  graphId,
  modelProvider: ModelProvider.claude,
  modelName: 'claude-3-5-sonnet-20241022',
  userContext: ['Deploy to staging environment']
});

// Monitor progress
const status = await codegenService.getJobStatus(jobId);
```

### 3. Custom RAG Query
```typescript
const similarGraphs = await dgraphClient.searchSimilarGraphsByEmbedding(
  embedding,
  5,
  companyId
);

const contextText = buildSimilarGraphsContext(similarGraphs);
```

This comprehensive RAG system enables AI coding agents to provide contextually relevant, production-ready Kubernetes infrastructure generation with robust error handling, performance optimization, and multi-provider support.