# Testing Guide

This document provides comprehensive information about testing utilities and patterns in the library.

## Test Utilities

The library provides a comprehensive set of testing utilities to help you create mock data and test your graph-based applications.

### Available Test Utilities

```typescript
import { testUtils } from '@kubegram/common-ts';

// Create mock Kubernetes resources
const mockService = testUtils.createMockKubernetesResource({
  kind: 'Service',
  metadata: { name: 'test-service' }
});

const mockDeployment = testUtils.createMockKubernetesResource({
  kind: 'Deployment',
  metadata: { name: 'test-deployment' }
});

// Create mock graph nodes
const mockNode = testUtils.createMockGraphNode({
  metadata: { status: 'active' }
});

// Test async operations
const mockAsyncFunction = testUtils.createMockAsyncFunction('result', 100);
const result = await mockAsyncFunction();
console.log('Async result:', result);
```

### Mock Resource Creation

#### Kubernetes Resources

```typescript
// Basic Kubernetes resource
const pod = testUtils.createMockKubernetesResource({
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: {
    name: 'test-pod',
    namespace: 'default',
    labels: { app: 'test' }
  },
  spec: {
    containers: [{
      name: 'test-container',
      image: 'nginx:latest'
    }]
  }
});

// Service with specific configuration
const service = testUtils.createMockKubernetesResource({
  kind: 'Service',
  metadata: { name: 'test-service' },
  spec: {
    type: 'ClusterIP',
    ports: [{ port: 80, targetPort: 3000 }],
    selector: { app: 'test' }
  }
});
```

#### Graph Nodes

```typescript
// Basic graph node
const node = testUtils.createMockGraphNode({
  resource: testUtils.createMockKubernetesResource(),
  edges: [],
  metadata: {
    status: 'active',
    labels: { environment: 'test' }
  }
});

// Node with specific resource type
const microserviceNode = testUtils.createMockGraphNode({
  resource: {
    name: 'test-microservice',
    type: 'Microservice',
    language: 'TypeScript'
  },
  metadata: { status: 'running' }
});
```

### Async Testing Utilities

```typescript
// Mock function that returns immediately
const immediateMock = testUtils.createMockAsyncFunction('immediate-result');

// Mock function with delay
const delayedMock = testUtils.createMockAsyncFunction('delayed-result', 200);

// Test async behavior
const start = Date.now();
const result = await delayedMock();
const duration = Date.now() - start;

expect(result).toBe('delayed-result');
expect(duration).toBeGreaterThanOrEqual(190); // Allow some tolerance
```

### Custom Jest Matchers

The library provides custom Jest matchers for validating Kubernetes resources and graph nodes:

```typescript
// Validate Kubernetes resource structure
expect(mockService).toBeValidKubernetesResource();

// Validate graph node structure
expect(mockNode).toBeValidGraphNode();
```

## Testing Patterns

### Graph Testing

```typescript
import { GraphImpl, ConnectionType } from '@kubegram/common-ts';

describe('Graph Operations', () => {
  let graph: GraphImpl;

  beforeEach(() => {
    graph = new GraphImpl({
      name: 'Test Graph',
      description: 'Test graph for unit tests'
    });
  });

  it('should add nodes correctly', () => {
    const node = testUtils.createMockGraphNode();
    graph.addNode('test-node', node);
    
    expect(graph.hasNode('test-node')).toBe(true);
    expect(graph.getNode('test-node')).toEqual(node);
  });

  it('should add edges correctly', () => {
    const sourceNode = testUtils.createMockGraphNode();
    const targetNode = testUtils.createMockGraphNode();
    
    graph.addNode('source', sourceNode);
    graph.addNode('target', targetNode);
    
    const edge = {
      source: sourceNode.resource,
      target: targetNode.resource,
      connectionType: ConnectionType.ROUTES_TO,
      metadata: { weight: 1 }
    };
    
    graph.addEdge(edge);
    
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]).toEqual(edge);
  });
});
```

### Microservice Testing

```typescript
import { GraphBuilder, createMicroserviceStack } from '@kubegram/common-ts';

describe('Microservice Management', () => {
  let graph: GraphImpl;
  let builder: GraphBuilder;

  beforeEach(() => {
    graph = new GraphImpl();
    builder = new GraphBuilder(graph);
  });

  it('should create microservice stack', () => {
    const stack = createMicroserviceStack({
      name: 'test-service',
      language: 'TypeScript',
      framework: 'Express',
      ports: [3000]
    });

    expect(stack).toBeDefined();
    expect(stack.name).toBe('test-service');
    expect(stack.language).toBe('TypeScript');
  });

  it('should add microservice to graph', () => {
    const microservice = testUtils.createMockKubernetesResource({
      type: 'Microservice',
      name: 'test-microservice'
    });

    builder.addMicroservice(microservice);

    expect(graph.nodes.size).toBeGreaterThan(0);
  });
});
```

### GraphQL Mapper Testing

```typescript
import { mapResourceToGraphQL, mapGraphToGraphQL } from '@kubegram/common-ts';

describe('GraphQL Mappers', () => {
  it('should map microservice to GraphQL', () => {
    const microservice = {
      name: 'test-api',
      type: 'Microservice',
      language: 'TypeScript',
      baseImage: 'node:18-alpine',
      image: 'test-api',
      version: '1.0.0'
    };

    const gql = mapResourceToGraphQL(microservice) as any;
    
    expect(gql.__typename).toBe('Microservice');
    expect(gql.name).toBe('test-api');
    expect(gql.language).toBe('TypeScript');
  });

  it('should map graph to GraphQL', () => {
    const graph = new GraphImpl();
    const node = testUtils.createMockGraphNode();
    graph.addNode('test-node', node);

    const gqlGraph = mapGraphToGraphQL(graph, { id: 'test-graph' });
    
    expect(gqlGraph.__typename).toBe('BaseGraph');
    expect(gqlGraph.id).toBe('test-graph');
    expect(gqlGraph.nodes).toHaveLength(1);
  });
});
```

### Validation Testing

```typescript
import { ProxyGraphValidator, ConnectionValidator } from '@kubegram/common-ts';

describe('Validation Systems', () => {
  let graph: GraphImpl;
  let validator: ProxyGraphValidator;

  beforeEach(() => {
    graph = new GraphImpl();
    validator = new ProxyGraphValidator(graph);
  });

  it('should validate nginx configuration', () => {
    const nginxConfig = {
      name: 'test-nginx',
      type: 'NginxServer',
      server: {
        listen: 80,
        server_name: 'test.example.com',
        locations: [{
          path: '/api',
          proxy_pass: 'http://backend:3000'
        }]
      }
    };

    const validation = validator.validateNginxServer(nginxConfig);
    
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should detect configuration issues', () => {
    const invalidConfig = {
      name: 'invalid-nginx',
      type: 'NginxServer',
      server: {
        listen: 80
        // Missing server_name and locations
      }
    };

    const validation = validator.validateNginxServer(invalidConfig);
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});
```

## Test Configuration

### Jest Configuration

The library uses Jest for testing with the following configuration:

```javascript
// jest.config.cjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/**/__tests__/**/*.test.js'
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(graphql|gql)$': 'jest-transform-graphql',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true
    }],
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 50,
      statements: 48
    }
  }
};
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --runTestsByPath src/__tests__/graphql-mappers.test.ts

# Run tests in watch mode
npm run test:watch
```

## Best Practices

### 1. Use Mock Utilities

Always use the provided test utilities instead of creating mock data manually:

```typescript
// ✅ Good
const mockService = testUtils.createMockKubernetesResource({
  kind: 'Service',
  metadata: { name: 'test-service' }
});

// ❌ Avoid
const mockService = {
  apiVersion: 'v1',
  kind: 'Service',
  metadata: { name: 'test-service' }
};
```

### 2. Test Edge Cases

Always test edge cases and error conditions:

```typescript
it('should handle empty graph', () => {
  const emptyGraph = new GraphImpl();
  const analysis = emptyGraph.analyze();
  
  expect(analysis.nodeCount).toBe(0);
  expect(analysis.edgeCount).toBe(0);
});

it('should throw error for invalid connections', () => {
  expect(() => {
    graph.addEdge({
      source: nonExistentResource,
      target: anotherResource,
      connectionType: ConnectionType.ROUTES_TO
    });
  }).toThrow();
});
```

### 3. Use Descriptive Test Names

Make test names descriptive and specific:

```typescript
// ✅ Good
it('should validate nginx configuration with missing server name', () => {
  // test implementation
});

// ❌ Avoid
it('should validate nginx', () => {
  // test implementation
});
```

### 4. Test Async Operations

Always test async operations properly:

```typescript
it('should handle async operations', async () => {
  const mockAsync = testUtils.createMockAsyncFunction('result', 100);
  
  const start = Date.now();
  const result = await mockAsync();
  const duration = Date.now() - start;
  
  expect(result).toBe('result');
  expect(duration).toBeGreaterThanOrEqual(90);
});
```

### 5. Clean Up After Tests

Use `beforeEach` and `afterEach` to ensure clean test state:

```typescript
describe('Graph Operations', () => {
  let graph: GraphImpl;

  beforeEach(() => {
    graph = new GraphImpl();
  });

  afterEach(() => {
    // Clean up if needed
    graph.clear();
  });
});
```
