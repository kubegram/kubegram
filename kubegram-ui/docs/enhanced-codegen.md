# Enhanced Code Generation with Result Retrieval & Storage

This document describes the enhanced code generation system that includes result retrieval from the `/:jobId/results` API endpoint and persistent storage in the format `{graphId: {nodeId: generatedCode[]}}`.

## 🎯 Overview

The enhanced system provides:

- ✅ **Result Retrieval**: Automatic fetching of detailed results when job status is `completed`
- ✅ **Persistent Storage**: Storage in Redux state and localStorage/cookies
- ✅ **Structured Format**: Data stored as `{graphId: {nodeId: generatedCode[]}}`
- ✅ **Redux Integration**: Complete state management with job tracking
- ✅ **Enhanced UI**: Real-time progress updates and code display
- ✅ **Error Handling**: Comprehensive error management for results fetching
- ✅ **Type Safety**: Full TypeScript interfaces for all data structures

## 🏗️ Architecture

### Enhanced Components

1. **`codegen.ts`** - Core API functions with result retrieval
2. **`codegenSlice.ts`** - Redux state management
3. **`CodeGenerationComponent.tsx`** - Enhanced React UI
4. **`codegenUtils.ts`** - Utility classes with Redux integration
5. **`codegenEnhanced.test.ts`** - Comprehensive test suite

### Data Flow

```
1. Job completed → fetchCodegenResults()
2. Results API → transformResultsToStorageFormat()
3. Store in Redux → dispatch(completeJobTracking())
4. Store in localStorage → saveGeneratedCodeToStorage()
5. UI Updates → callbacks.onResultsFetched(), onCodeStored()
```

## 📊 Data Structures

### API Response Format
```typescript
interface CodegenResults {
  graphId: string;
  generatedCodes: GeneratedCode[];
  jobId: string;
  timestamp: string;
  summary?: {
    totalNodes: number;
    successfulGenerations: number;
    failedGenerations: number;
  };
}

interface GeneratedCode {
  nodeId: string;
  code: string;
  language?: string;
  framework?: string;
  metadata?: Record<string, any>;
}
```

### Storage Format
```typescript
interface StoredCodegenData {
  [graphId: string]: {
    [nodeId: string]: string[];
  };
}
```

### Example Storage Data
```typescript
{
  "graph-123": {
    "node-456": ["import React from 'react';\nexport default function App() { return <div>Hello</div>; }"],
    "node-789": ["from flask import Flask\napp = Flask(__name__)\n\n@app.route('/')\ndef hello():\n    return 'Hello World!'"]
  },
  "graph-456": {
    "node-101": ["console.log('Hello World');"]
  }
}
```

## 🚀 Usage Examples

### Basic Usage with Redux Integration
```typescript
import { pollCodeGenerationWithRedux } from '@/store/api/codegen';

const result = await pollCodeGenerationWithRedux(
  input,
  config,
  callbacks,
  token,
  abortSignal,
  dispatch
);
```

### Enhanced React Component
```typescript
import { CodeGenerationComponent } from '@/components/CodeGenerationComponent';

<CodeGenerationComponent
  input={codegenInput}
  token={authToken}
  useRedux={true}
  showStoredCode={true}
  preset="standard"
  onComplete={(results) => console.log('Done!', results)}
/>
```

### Manual Results Fetching
```typescript
import { fetchCodegenResults, saveGeneratedCodeToStorage } from '@/store/api/codegen';

const results = await fetchCodegenResults(jobId, token);
saveGeneratedCodeToStorage(results);
```

### Storage Operations
```typescript
import { 
  loadGeneratedCodeFromStorage, 
  saveGeneratedCodeToStorage,
  clearGeneratedCodeStorage 
} from '@/store/api/codegen';

// Load stored code
const storedCode = loadGeneratedCodeFromStorage();

// Save new results
saveGeneratedCodeToStorage(results);

// Clear all storage
clearGeneratedCodeStorage();
```

## 🔧 Redux Integration

### State Structure
```typescript
interface CodegenState {
  storedCode: StoredCodegenData;
  activeJobs: Record<string, CodegenJob>;
  jobHistory: CodegenJob[];
  isLoading: boolean;
  isFetchingResults: boolean;
  error: string | null;
  resultsError: string | null;
  totalJobsCompleted: number;
  totalCodeGenerated: number;
}
```

### Actions
```typescript
// Job tracking
dispatch(startJobTracking({ jobId, graphId }));
dispatch(updateJobStatus({ jobId, status }));
dispatch(completeJobTracking({ jobId, results, totalAttempts, totalDuration }));
dispatch(failJobTracking({ jobId, error, totalAttempts, totalDuration }));
dispatch(cancelJobTracking({ jobId }));

// Code management
dispatch(setGeneratedCode({ graphId, nodeId, codes }));
dispatch(clearGeneratedCode({ graphId }));
dispatch(clearAllCodegenData());
```

### Selectors
```typescript
// Get all stored code
const storedCode = useSelector(selectStoredCode);

// Get code for specific graph
const graphCode = useSelector((state) => selectGeneratedCodeForGraph(state, graphId));

// Get code for specific node
const nodeCode = useSelector((state) => selectGeneratedCodeForNode(state, graphId, nodeId));

// Get statistics
const stats = useSelector(selectCodegenStats);
```

## 🎨 UI Components

### Enhanced CodeGenerationComponent
```typescript
<CodeGenerationComponent
  input={input}
  token={token}
  useRedux={true}           // Enable Redux integration
  showStoredCode={true}     // Show stored code display
  preset="standard"
  onComplete={(results) => {
    // Handle completion with detailed results
    console.log('Generated codes:', results.generatedCodes);
  }}
/>
```

### UI Features
- **Real-time Progress**: Attempt tracking, status updates, next poll timing
- **Results Display**: Show fetched results and storage progress
- **Stored Code Viewer**: Display generated code by node with syntax highlighting
- **Statistics**: Job completion metrics and code generation stats
- **Error Handling**: User-friendly error messages and retry options

## 🔄 Enhanced Polling Flow

### Completed Status Handling
```typescript
case JOB_STATUS.COMPLETED:
  try {
    // 1. Fetch detailed results
    const results = await fetchCodegenResults(jobId, token);
    
    // 2. Notify results fetched
    callbacks?.onResultsFetched?.(results);
    
    // 3. Store in localStorage
    saveGeneratedCodeToStorage(results);
    
    // 4. Update Redux state
    dispatch(completeJobTracking({ jobId, results, totalAttempts, totalDuration }));
    
    // 5. Notify code storage
    results.generatedCodes.forEach(generated => {
      callbacks?.onCodeStored?.(results.graphId, generated.nodeId, [generated.code]);
    });
    
    // 6. Complete with results
    callbacks?.onComplete?.(results);
    
    return { success: true, status: 'COMPLETED', result: results };
  } catch (resultError) {
    // Handle results fetch error
    const errorMessage = handleResultsError(resultError, callbacks);
    return { success: false, status: 'ERROR', error: errorMessage };
  }
```

## 🛠️ API Integration

### Results API Endpoint
```
GET /api/v1/public/graph/codegen/{jobId}/results
```

### Response Format
```json
{
  "graphId": "graph-123",
  "jobId": "job-456",
  "timestamp": "2026-02-06T12:00:00Z",
  "generatedCodes": [
    {
      "nodeId": "node-1",
      "code": "import React from 'react';\nexport default function App() { return <div>Hello</div>; }",
      "language": "javascript",
      "framework": "react"
    }
  ],
  "summary": {
    "totalNodes": 1,
    "successfulGenerations": 1,
    "failedGenerations": 0
  }
}
```

## 💾 Storage Implementation

### localStorage + Cookies
- **Primary**: localStorage for fast access
- **Backup**: Cookies with 30-day expiration
- **Format**: `{graphId: {nodeId: generatedCode[]}}`
- **Key**: `kubegram_generated_code`

### Storage Functions
```typescript
// Save results to storage
saveGeneratedCodeToStorage(results);

// Load all stored code
const storedCode = loadGeneratedCodeFromStorage();

// Clear storage
clearGeneratedCodeStorage();
```

### Data Transformation
```typescript
// Transform API results to storage format
const storageFormat = transformResultsToStorageFormat(results);
// Result: { "graph-123": { "node-1": ["code here"] } }
```

## 🧪 Testing

### Test Coverage
- ✅ Results API integration
- ✅ Storage functionality
- ✅ Redux state management
- ✅ Error handling scenarios
- ✅ Data format validation
- ✅ Complete flow simulation
- ✅ Performance testing

### Running Tests
```typescript
import { runAllEnhancedTests } from '@/store/api/codegenEnhanced.test';

// Run all tests
await runAllEnhancedTests();

// Run specific tests
await testResultsApiIntegration();
await testStorageFunctionality();
await testReduxIntegration();
```

### Test Examples
```typescript
// Test results API integration
const result = await testResultsApiIntegration();
console.log('Storage format:', result.storageFormat);

// Test storage functionality
const storageResult = await testStorageFunctionality();
console.log('Data integrity:', storageResult.isDataIntact);

// Test complete flow
const flowResult = await testCompleteFlowSimulation();
console.log('Final state:', flowResult.finalData);
```

## 🔍 Error Handling

### Results Fetch Errors
- **404 Not Found**: Job may have been deleted or expired
- **401/403 Unauthorized**: Authentication failed
- **5xx Server Error**: Temporary server issue
- **Network Error**: Connection problems

### Storage Errors
- **Quota Exceeded**: localStorage full
- **Invalid Data**: Corrupted storage data
- **Permission Denied**: Browser storage restrictions

### Error Recovery
- Automatic retry for network errors
- Fallback to memory-only storage
- User notification with actionable messages
- Graceful degradation without breaking functionality

## 📈 Performance Considerations

### Memory Usage
- Efficient data structures with minimal overhead
- Lazy loading of stored code
- Cleanup of old job history

### Storage Efficiency
- Compressed storage format
- Automatic cleanup of expired data
- Cookie backup for persistence

### Network Optimization
- Single results API call per job
- Efficient data transformation
- Minimal payload size

## 🔧 Configuration

### Enhanced Polling Config
```typescript
const config: Partial<PollingConfig> = {
  initialDelay: 30000,        // 30 seconds
  maxDelay: 300000,           // 5 minutes max
  maxTotalTime: 1800000,      // 30 minutes total
  backoffMultiplier: 1.5,      // 1.5x exponential growth
  maxRetries: 20              // Optional retry limit
};
```

### Storage Configuration
```typescript
export const GENERATED_CODE_STORAGE_KEY = 'kubegram_generated_code';
export const CODEGEN_COOKIE_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
```

## 🚀 Migration Guide

### From Basic Polling
```typescript
// Before
const result = await pollCodeGenerationWithBackoff(jobId, config, callbacks);

// After (with Redux)
const result = await pollCodeGenerationWithRedux(input, config, callbacks, token, abortSignal, dispatch);
```

### From Manual Storage
```typescript
// Before
localStorage.setItem('code', JSON.stringify(codeData));

// After
saveGeneratedCodeToStorage(results);
```

## 🎯 Best Practices

### 1. Always Use Redux Integration
```typescript
// Recommended
const result = await pollCodeGenerationWithRedux(input, config, callbacks, token, abortSignal, dispatch);
```

### 2. Handle All Callback States
```typescript
const callbacks: EnhancedPollingCallbacks = {
  onProgress: handleProgress,
  onStatusChange: handleStatusChange,
  onResultsFetched: handleResultsFetched,
  onCodeStored: handleCodeStored,
  onError: handleError,
  onComplete: handleComplete
};
```

### 3. Implement Error Boundaries
```typescript
try {
  const result = await pollCodeGenerationWithRedux(input, config, callbacks);
} catch (error) {
  // Handle unexpected errors
  showError('An unexpected error occurred');
}
```

### 4. Use Storage Selectors
```typescript
// Efficient data access
const graphCode = useSelector((state) => selectGeneratedCodeForGraph(state, graphId));
const nodeCode = useSelector((state) => selectGeneratedCodeForNode(state, graphId, nodeId));
```

## 🔮 Future Enhancements

### Planned Features
1. **Code Export**: Download generated code as files
2. **Version History**: Track multiple code versions per node
3. **Code Diff**: Show changes between generations
4. **Batch Operations**: Process multiple graphs simultaneously
5. **Real-time Updates**: WebSocket integration for instant updates

### Extension Points
- Custom storage adapters
- Additional result formats
- Enhanced error recovery
- Performance monitoring

## 📚 Support

For issues, questions, or contributions:

1. **API Issues**: Check `codegen.ts` for endpoint configuration
2. **Storage Problems**: Review storage functions and format validation
3. **Redux State**: Examine `codegenSlice.ts` for state management
4. **UI Issues**: Check `CodeGenerationComponent.tsx` for component logic
5. **Testing**: Run `codegenEnhanced.test.ts` for validation

---

**Version**: 2.0.0  
**Last Updated**: 2026-02-06  
**Compatibility**: React 18+, TypeScript 5+, Redux Toolkit  

### 🎉 Summary

The enhanced code generation system provides a complete solution for:

- **Result Retrieval**: Automatic fetching from `/:jobId/results` API
- **Persistent Storage**: Structured storage in `{graphId: {nodeId: generatedCode[]}}` format
- **Redux Integration**: Complete state management with job tracking
- **Enhanced UI**: Real-time progress and code display
- **Comprehensive Testing**: Full test coverage for all functionality

The system is production-ready, thoroughly tested, and follows best practices for performance, error handling, and user experience.
