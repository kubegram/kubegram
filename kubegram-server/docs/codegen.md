## Code Generation

### Scenario

1. The user creates a new project or opens an existing one.
2. The user then sends a request with a graph to generate code from.
3. The server then sends this request to the RAG system.

### Backend + RAG communication

1. The server initializes the code generation process by sending a request to the RAG system. Using the folowing mutation:
```graphql
 """Generate code for a graph"""
  initializeCodeGen(input: GenerateCodeInput!): JobStatus!
```
using the following function from @kubegram/common-ts:
```typescript
graphqlSdk.InitializeCodeGen()
```
then use the following function from @kubegram/common-ts to get the status of the code generation:
```typescript
graphqlSdk.JobStatus()
```

2. The Client asks the server about the status of the code generation every 1 minute to 5 minutes in high load times.
3. Upon receiving the request from the client, the server asks the RAG system about the status of the code generation and returns the result if the generation is complete.
- Use the following function from @kubegram/common-ts to get the result of the code generation:
```typescript
graphqlSdk.GenerateCode()
```