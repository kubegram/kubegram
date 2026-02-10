# Code Generation Polling with Exponential Backoff

This document describes the implementation of the exponential backoff polling system for code generation jobs in the KUBEGRAM UI.

## Overview

The polling system provides a robust, configurable way to monitor long-running code generation jobs with the following features:

- ✅ **Exponential Backoff**: Intelligent delay calculation between polls
- ✅ **UI Progress Updates**: Real-time callbacks for user interface updates
- ✅ **Cancellation Support**: AbortController integration for clean cancellation
- ✅ **Error Handling**: Comprehensive error management with user-friendly messages
- ✅ **Configurable Timing**: All delays and timeouts are customizable
- ✅ **Type Safety**: Full TypeScript support with proper interfaces

## Architecture

### Core Components

1. **`codegen.ts`** - Main polling logic and API integration
2. **`codegenUtils.ts`** - Utility classes and helper functions
3. **`CodeGenerationComponent.tsx`** - React UI component
4. **`codegen.test.ts`** - Test examples and validation

### Key Functions

#### `pollCodeGenerationWithBackoff()`
The core polling function with exponential backoff, UI callbacks, and cancellation support.

#### `generateCodeWithPolling()`
End-to-end function that combines job initiation with polling.

#### `CodeGenerationManager`
Utility class for managing polling state and UI integration.

## Usage Examples

### Basic Usage

```typescript
import { pollCodeGenerationWithBackoff } from '@/store/api/codegen';

const result = await pollCodeGenerationWithBackoff(
  'job-id-123',
  {
    initialDelay: 30000,    // 30 seconds
    maxTotalTime: 1800000   // 30 minutes
  },
  {
    onProgress: (attempt, status, delay) => {
      console.log(`Attempt ${attempt}: ${status}`);
    },
    onComplete: (result) => {
      console.log('Success:', result);
    },
    onError: (error) => {
      console.error('Failed:', error);
    }
  },
  'auth-token'
);
```

### With Cancellation

```typescript
const abortController = new AbortController();

const pollingPromise = pollCodeGenerationWithBackoff(
  jobId,
  config,
  callbacks,
  token,
  abortController.signal
);

// Cancel if needed
cancelButton.onclick = () => {
  abortController.abort();
};
```

### React Component Usage

```typescript
import { CodeGenerationComponent } from '@/components/CodeGenerationComponent';

<CodeGenerationComponent
  input={codegenInput}
  token={authToken}
  preset="standard"
  onComplete={(result) => console.log('Done!', result)}
  onError={(error) => console.error('Failed!', error)}
/>
```

## Configuration

### Default Configuration

```typescript
const defaultConfig: PollingConfig = {
  initialDelay: 30000,        // 30 seconds
  maxDelay: 300000,           // 5 minutes max between polls
  maxTotalTime: 1800000,      // 30 minutes total
  backoffMultiplier: 1.5,      // 1.5x exponential growth
  maxRetries: undefined        // No explicit retry limit
};
```

### Configuration Presets

```typescript
import { PollingPresets } from '@/store/api/codegenUtils';

// Fast polling for testing
PollingPresets.fast

// Standard polling for production  
PollingPresets.standard

// Aggressive polling for urgent jobs
PollingPresets.aggressive
```

### Custom Configuration

```typescript
const customConfig: Partial<PollingConfig> = {
  initialDelay: 15000,     // 15 seconds
  maxTotalTime: 900000,     // 15 minutes
  backoffMultiplier: 2.0,   // 2x growth
  maxRetries: 20            // Limit to 20 attempts
};
```

## Status Handling

The polling system handles different job statuses as follows:

| Status | Action |
|--------|--------|
| `pending` | Continue polling with exponential backoff |
| `running` | Continue polling with exponential backoff |
| `completed` | Return result immediately |
| `failed` | Return error with user-friendly message |

## Error Handling

### Error Categories

1. **Authentication Errors** (401/403)
   - Clear tokens and prompt login
   - Message: "Authentication failed. Please log in and try again."

2. **Server Errors** (5xx)
   - Continue polling with backoff
   - Message: "Server error. Please try again in a few moments."

3. **Network Errors**
   - Continue polling with backoff
   - Message: "Network connection failed. Please check your connection and try again."

4. **Cancellation**
   - Stop polling immediately
   - Message: "Code generation was cancelled."

5. **Timeout**
   - Stop after max total time
   - Message: "Code generation timed out after X minutes"

## Exponential Backoff Algorithm

The delay calculation follows this pattern:

```
Delay 1: 30 seconds
Delay 2: 45 seconds (30 * 1.5)
Delay 3: 68 seconds (45 * 1.5)
Delay 4: 102 seconds (68 * 1.5)
...
Capped at: 5 minutes (300 seconds)
```

## UI Integration

### Progress Callbacks

```typescript
const callbacks: PollingCallbacks = {
  onProgress: (attempt, status, delay) => {
    // Update progress bar
    setProgress(`Attempt ${attempt}: ${status}`);
    setNextCheckIn(delay / 1000);
  },
  
  onStatusChange: (status) => {
    // Update status display
    setStatus(status);
  },
  
  onError: (error) => {
    // Show error message
    showError(error);
  },
  
  onComplete: (result) => {
    // Show success and result
    showSuccess(result);
  }
};
```

### React State Management

```typescript
const [progress, setProgress] = useState('');
const [status, setStatus] = useState('');
const [loading, setLoading] = useState(false);
const [result, setResult] = useState(null);
const [error, setError] = useState('');
```

## Testing

### Running Tests

```typescript
import { runAllExamples } from '@/store/api/codegen.test';

// Run all test examples
await runAllExamples();

// Run specific examples
await basicPollingExample();
await cancellationExample();
```

### Test Scenarios

1. **Basic Polling** - Normal job progression
2. **Cancellation** - Abort during polling
3. **Error Handling** - Network and server errors
4. **Performance** - Timing and metrics validation
5. **Configuration** - Different preset validation

## Performance Considerations

### Memory Usage

- Minimal memory footprint with efficient state management
- Cleanup on component unmount prevents memory leaks
- AbortController ensures proper resource cleanup

### Network Efficiency

- Exponential backoff reduces server load
- Configurable delays prevent API spam
- Timeout limits prevent infinite polling

### UI Responsiveness

- Non-blocking async operations
- Real-time progress updates
- Smooth cancellation without UI freezing

## Best Practices

### 1. Always Provide Cleanup

```typescript
useEffect(() => {
  return () => {
    abortController?.abort();
  };
}, [abortController]);
```

### 2. Handle All Callback States

```typescript
const callbacks: PollingCallbacks = {
  onProgress: handleProgress,
  onStatusChange: handleStatusChange,
  onError: handleError,
  onComplete: handleComplete
};
```

### 3. Use Appropriate Presets

```typescript
// Development/testing
preset: 'fast'

// Production
preset: 'standard'

// Urgent jobs
preset: 'aggressive'
```

### 4. Implement Error Boundaries

```typescript
try {
  const result = await generateCodeWithPolling(input, config, callbacks);
} catch (error) {
  // Handle unexpected errors
  showError('An unexpected error occurred');
}
```

## Migration Guide

### From Simple Polling

```typescript
// Before
const status = await pollCodegenStatus(jobId);

// After
const result = await pollCodeGenerationWithBackoff(jobId, config, callbacks);
```

### From Manual Polling

```typescript
// Before
let status = 'pending';
while (status === 'pending') {
  await setTimeout(5000);
  const response = await pollCodegenStatus(jobId);
  status = response.status;
}

// After
const result = await generateCodeWithPolling(input, config, callbacks);
```

## Troubleshooting

### Common Issues

1. **Polling Not Starting**
   - Check if jobId is valid
   - Verify authentication token
   - Ensure API endpoints are accessible

2. **UI Not Updating**
   - Verify callback functions are properly implemented
   - Check React state management
   - Ensure component is not unmounted

3. **Cancellation Not Working**
   - Verify AbortController is properly shared
   - Check if abort signal is passed to polling function
   - Ensure cleanup on component unmount

4. **Timeout Issues**
   - Adjust maxTotalTime configuration
   - Check server processing times
   - Verify network connectivity

### Debug Mode

Enable detailed logging:

```typescript
const callbacks: PollingCallbacks = {
  onProgress: (attempt, status, delay) => {
    console.log('Debug:', { attempt, status, delay });
  }
};
```

## Future Enhancements

### Planned Features

1. **Retry Strategies** - Configurable retry patterns
2. **Progress Estimation** - Time remaining calculations
3. **Batch Polling** - Monitor multiple jobs simultaneously
4. **Persistence** - Resume polling after page refresh
5. **WebSockets** - Real-time updates instead of polling

### Extension Points

The system is designed to be extensible:

- Custom backoff algorithms
- Additional status handling
- Enhanced error categorization
- Progress visualization components

## Support

For issues, questions, or contributions:

1. Check the test examples in `codegen.test.ts`
2. Review the React component in `CodeGenerationComponent.tsx`
3. Examine the utility functions in `codegenUtils.ts`
4. Refer to the core implementation in `codegen.ts`

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-06  
**Compatibility**: React 18+, TypeScript 5+
