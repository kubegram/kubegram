import { 
  type PollingConfig, 
  type PollingCallbacks, 
  type PollingResult, 
  generateCodeWithPolling,
  pollCodeGenerationWithRedux,
  type EnhancedPollingCallbacks,
  type CodegenResults
} from '@/store/api/codegen';
import { type InitiateCodegenInput } from '@/store/api/codegen';
import { useDispatch } from 'react-redux';

/**
 * Example usage of the code generation polling with UI updates
 * This demonstrates how to integrate the polling function with React components
 */

export class CodeGenerationManager {
  private abortController: AbortController | null = null;
  private dispatch: any;
  
  constructor(dispatch?: any) {
    this.dispatch = dispatch;
  }
  
  /**
   * Start code generation with polling and UI updates (basic version)
   */
  async startCodeGeneration(
    input: InitiateCodegenInput,
    uiCallbacks: {
      setProgress: (progress: string) => void;
      setStatus: (status: string) => void;
      setLoading: (loading: boolean) => void;
      setResult: (result: any) => void;
      setError: (error: string) => void;
    },
    config?: Partial<PollingConfig>,
    token?: string
  ): Promise<PollingResult> {
    // Cancel any existing polling
    this.cancelCurrentGeneration();
    
    // Create new abort controller
    this.abortController = new AbortController();
    
    // Setup polling callbacks
    const pollingCallbacks: PollingCallbacks = {
      onProgress: (attempt, status, delay) => {
        uiCallbacks.setProgress(`Attempt ${attempt}: ${status} (next check in ${Math.round(delay / 1000)}s)`);
      },
      onStatusChange: (status) => {
        uiCallbacks.setStatus(`Job status: ${status}`);
      },
      onError: (error) => {
        uiCallbacks.setError(error);
        uiCallbacks.setLoading(false);
      },
      onComplete: (result) => {
        uiCallbacks.setResult(result);
        uiCallbacks.setLoading(false);
        uiCallbacks.setProgress('Code generation completed successfully!');
      }
    };

    // Set loading state
    uiCallbacks.setLoading(true);
    uiCallbacks.setProgress('Starting code generation...');

    try {
      // Start polling
      const result = await generateCodeWithPolling(
        input,
        config,
        pollingCallbacks,
        token,
        this.abortController.signal
      );

      // Handle final result
      if (!result.success && result.status !== 'CANCELLED') {
        uiCallbacks.setError(result.error || 'Code generation failed');
      }
      
      uiCallbacks.setLoading(false);
      return result;

    } catch (error: any) {
      uiCallbacks.setLoading(false);
      uiCallbacks.setError(error.message || 'An unexpected error occurred');
      throw error;
    }
  }
  
  /**
   * Start code generation with Redux integration and enhanced UI updates
   */
  async startCodeGenerationWithRedux(
    input: InitiateCodegenInput,
    uiCallbacks: {
      setProgress: (progress: string) => void;
      setStatus: (status: string) => void;
      setLoading: (loading: boolean) => void;
      setResult: (result: CodegenResults) => void;
      setError: (error: string) => void;
      setResultsFetched?: (results: CodegenResults) => void;
      setCodeStored?: (graphId: string, nodeId: string, codes: string[]) => void;
    },
    config?: Partial<PollingConfig>,
    token?: string
  ): Promise<PollingResult> {
    // Cancel any existing polling
    this.cancelCurrentGeneration();
    
    // Create new abort controller
    this.abortController = new AbortController();
    
    // Setup enhanced polling callbacks
    const pollingCallbacks: EnhancedPollingCallbacks = {
      onProgress: (attempt, status, delay) => {
        uiCallbacks.setProgress(`Attempt ${attempt}: ${status} (next check in ${Math.round(delay / 1000)}s)`);
      },
      onStatusChange: (status) => {
        uiCallbacks.setStatus(`Job status: ${status}`);
      },
      onError: (error) => {
        uiCallbacks.setError(error);
        uiCallbacks.setLoading(false);
      },
      onComplete: (result) => {
        uiCallbacks.setResult(result);
        uiCallbacks.setLoading(false);
        uiCallbacks.setProgress('Code generation completed successfully!');
      },
      onResultsFetched: (results) => {
        uiCallbacks.setResultsFetched?.(results);
        uiCallbacks.setProgress('Results fetched, storing generated code...');
      },
      onCodeStored: (graphId, nodeId, codes) => {
        uiCallbacks.setCodeStored?.(graphId, nodeId, codes);
        uiCallbacks.setProgress(`Code stored for node ${nodeId}`);
      },
      onStorageError: (error) => {
        uiCallbacks.setError(`Storage error: ${error}`);
      }
    };

    // Set loading state
    uiCallbacks.setLoading(true);
    uiCallbacks.setProgress('Starting code generation with Redux tracking...');

    try {
      // Start enhanced polling with Redux integration
      const result = await pollCodeGenerationWithRedux(
        input,
        config,
        pollingCallbacks,
        token,
        this.abortController.signal,
        this.dispatch
      );

      // Handle final result
      if (!result.success && result.status !== 'CANCELLED') {
        uiCallbacks.setError(result.error || 'Code generation failed');
      }
      
      uiCallbacks.setLoading(false);
      return result;

    } catch (error: any) {
      uiCallbacks.setLoading(false);
      uiCallbacks.setError(error.message || 'An unexpected error occurred');
      throw error;
    }
  }

  /**
   * Cancel the current code generation
   */
  cancelCurrentGeneration(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Check if code generation is currently running
   */
  isGenerationRunning(): boolean {
    return this.abortController !== null && !this.abortController.signal.aborted;
  }
}

/**
 * React hook for code generation management with Redux integration
 */
export const useCodeGeneration = () => {
  const dispatch = useDispatch();
  const manager = new CodeGenerationManager(dispatch);
  
  const generateCode = async (
    _input: InitiateCodegenInput,
    _config?: Partial<PollingConfig>,
    _token?: string,
    _useRedux: boolean = true
  ) => {
    // This would be implemented with React state management
    // Example implementation:
    /*
    const [progress, setProgress] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    
    if (useRedux) {
      return await manager.startCodeGenerationWithRedux(
        input,
        { setProgress, setStatus, setLoading, setResult, setError },
        config,
        token
      );
    } else {
      return await manager.startCodeGeneration(
        input,
        { setProgress, setStatus, setLoading, setResult, setError },
        config,
        token
      );
    }
    */
  };

  const cancelGeneration = () => {
    manager.cancelCurrentGeneration();
  };

  const isRunning = manager.isGenerationRunning();

  return {
    generateCode,
    cancelGeneration,
    isRunning
  };
};

/**
 * Example configuration presets
 */
export const PollingPresets = {
  // Fast polling for testing
  fast: {
    initialDelay: 5000,      // 5 seconds
    maxDelay: 30000,         // 30 seconds
    maxTotalTime: 300000,    // 5 minutes
    backoffMultiplier: 1.2
  },
  
  // Standard polling for production
  standard: {
    initialDelay: 30000,     // 30 seconds
    maxDelay: 300000,        // 5 minutes
    maxTotalTime: 1800000,   // 30 minutes
    backoffMultiplier: 1.5
  },
  
  // Aggressive polling for urgent jobs
  aggressive: {
    initialDelay: 15000,     // 15 seconds
    maxDelay: 120000,        // 2 minutes
    maxTotalTime: 900000,    // 15 minutes
    backoffMultiplier: 1.3
  }
};