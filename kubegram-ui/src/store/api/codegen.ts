import type { CanvasGraph } from '@/types/canvas';
import { apiClient } from '@/lib/api/axiosClient';
import { normalizeProviderForApi } from '@/lib/providerUtils';
import { startJobTracking, cancelJobTracking, failJobTracking, updateJobStatus, completeJobTracking } from '../slices/codegen/codegenSlice';
import { JOB_STATUS, normalizeJobStatus, type JobStatusStatus } from '@kubegram/common-ts';

/**
 * Job status enumeration for code generation
 */
export type JobStatus = JobStatusStatus;

/**
 * Polling configuration interface
 */
export interface PollingConfig {
  initialDelay: number;           // 30 seconds
  maxDelay: number;               // 5 minutes max between polls
  maxTotalTime: number;           // 30 minutes total timeout
  backoffMultiplier: number;      // 1.5x exponential growth
  maxRetries?: number;            // Optional retry limit
}

/**
 * Polling callbacks for UI updates
 */
export interface PollingCallbacks {
  onProgress?: (attempt: number, status: string, delay: number) => void;
  onStatusChange?: (status: string) => void;
  onError?: (error: string) => void;
  onComplete?: (result: any) => void;
}

/**
 * Polling result interface
 */
export interface PollingResult {
  success: boolean;
  status: 'COMPLETED' | 'ERROR' | 'TIMEOUT' | 'CANCELLED';
  result?: any;
  error?: string;
  totalAttempts: number;
  totalDuration: number;
  finalStatus: string;
}

/**
 * Generated code interface for individual nodes
 */
export interface GeneratedCode {
  nodeId: string;
  code: string;
  language?: string;
  framework?: string;
  metadata?: Record<string, any>;
}

/**
 * Code generation results from the results API
 */
export interface CodegenResults {
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

/**
 * Storage format for generated code: {graphId: {nodeId: generatedCode[]}}
 */
export interface StoredCodegenData {
  [graphId: string]: {
    [nodeId: string]: string[];
  };
}

/**
 * Enhanced polling callbacks with results-specific callbacks
 */
export interface EnhancedPollingCallbacks extends PollingCallbacks {
  onResultsFetched?: (results: CodegenResults) => void;
  onCodeStored?: (graphId: string, nodeId: string, codes: string[]) => void;
  onStorageError?: (error: string) => void;
}

// Define structure for Code Generation Request based on Swagger
// POST /graph/codegen
// Body: { request: { graph: GraphInput, project: { id, name } } }

// We need to match GraphInput structure from Swagger
// GraphInput: { name, description, graphType, companyId, userId, nodes: [], bridges: [] }
interface GraphInput {
  name: string;
  description?: string;
  graphType: string;
  companyId: string;
  userId: string;
  nodes: any[];
  bridges: any[];
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface InitiateCodegenInput {
  project: {
    id: string;
    name: string;
  };
  graph: CanvasGraph;
  llmConfig: {
    provider: string; // Can be lowercase (UI) or uppercase (API)
    model: string;
  };
  context?: ConversationMessage[];
}

export interface CodegenResponse {
  jobId: string;
}

const mapFrontendGraphToInput = (fg: CanvasGraph): GraphInput => {
  return {
    name: fg.name || 'Untitled Graph',
    description: (fg as any).description || '',
    graphType: (fg as any).graphType || 'KUBERNETES',
    companyId: fg.companyId || '1', // Default
    userId: fg.userId || '1', // Default
    nodes: fg.nodes || [],
    bridges: fg.arrows || []
  };
};

/**
 * Initialize code generation job
 */
export const initiateCodeGeneration = async (input: InitiateCodegenInput, token?: string): Promise<string> => {
  const payload = {
    graph: mapFrontendGraphToInput(input.graph),
    llmConfig: {
      ...input.llmConfig,
      provider: normalizeProviderForApi(input.llmConfig.provider)
    },
    project: input.project,
    context: input.context // Send context to backend API
  };

  const response = await apiClient.post<{ jobId: string }>(
    '/api/v1/public/graph/codegen',
    payload, // The swagger says param name is "request", but typically body is the object. 
    // Swagger: parameter name: request, in: body. schema: type: object properties: graph...
    // This usually means the body IS the object with properties graph and project.
    // It does NOT mean { request: { ... } } unless the schema explicitly wraps it.
    // Looking at Swagger:
    // parameters:
    // - name: request
    //   in: body
    //   schema:
    //     type: object
    //     properties:
    //       graph: ...
    //       project: ...
    // So the body should be { graph: ..., project: ... }
    token ? { headers: { 'Authorization': `Bearer ${token}` } } : undefined
  );

  console.log('Job initiated:', response.data.jobId);

  return response.data.jobId;
};

/**
 * Storage constants
 */
export const GENERATED_CODE_STORAGE_KEY = 'kubegram_generated_code';
export const CODEGEN_COOKIE_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Default polling configuration
 */
const defaultConfig: PollingConfig = {
  initialDelay: 30000,        // 30 seconds
  maxDelay: 300000,           // 5 minutes max between polls
  maxTotalTime: 1800000,      // 30 minutes total
  backoffMultiplier: 1.5,      // 1.5x exponential growth
  maxRetries: undefined        // No explicit retry limit
};

/**
 * Calculate next delay with exponential backoff
 */
const calculateNextDelay = (currentDelay: number, config: PollingConfig): number => {
  const nextDelay = currentDelay * config.backoffMultiplier;
  return Math.min(nextDelay, config.maxDelay);
};

/**
 * Handle polling errors and return user-friendly messages
 */
const handlePollingError = (error: any, callbacks?: PollingCallbacks): string => {
  let errorMessage: string;

  if (error.name === 'AbortError') {
    errorMessage = 'Code generation was cancelled.';
  } else if (error.response?.status === 401 || error.response?.status === 403) {
    errorMessage = 'Authentication failed. Please log in and try again.';
  } else if (error.response?.status >= 500) {
    errorMessage = 'Server error. Please try again in a few moments.';
  } else if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
    errorMessage = 'Network connection failed. Please check your connection and try again.';
  } else {
    errorMessage = 'An unexpected error occurred. Please try again.';
  }

  callbacks?.onError?.(errorMessage);
  return errorMessage;
};



/**
 * Poll code generation status with exponential backoff
 */
export const pollCodegenStatus = async (jobId: string, token?: string): Promise<{ status: JobStatusStatus; result?: any }> => {
  const response = await apiClient.get<{ status: string; result?: any }>(
    `/api/v1/public/graph/codegen/${jobId}/status`,
    token ? { headers: { 'Authorization': `Bearer ${token}` } } : undefined
  );
  const normalizedStatus = normalizeJobStatus(response.data.status);
  if (!normalizedStatus) {
    console.warn(`Unknown job status: ${response.data.status}, treating as pending`);
  }
  return {
    ...response.data,
    status: normalizedStatus ?? JOB_STATUS.PENDING,
  };
};

/**
 * Fetch detailed results for a completed code generation job
 */
interface BackendGeneratedCodeNode {
  id: string;
  name: string;
  nodeType: string;
  config?: string;
  spec?: any;
  generatedCodeMetadata: {
    fileName: string;
    path: string;
  };
}

interface BackendCodegenResults {
  totalFiles: number;
  namespace: string;
  graphId: string;
  originalGraphId: string;
  nodes: BackendGeneratedCodeNode[];
}

export const fetchCodegenResults = async (
  jobId: string,
  token?: string
): Promise<CodegenResults> => {
  const response = await apiClient.get<BackendCodegenResults>(
    `/api/v1/public/graph/codegen/${jobId}/results`,
    token ? { headers: { 'Authorization': `Bearer ${token}` } } : undefined
  );

  const backendData = response.data;

  // Transform to frontend CodegenResults format
  return {
    jobId,
    graphId: backendData.graphId,
    timestamp: new Date().toISOString(), // Backend doesn't return timestamp in results
    generatedCodes: backendData.nodes.map(node => ({
      nodeId: node.id,
      code: node.config || JSON.stringify(node.spec, null, 2) || '',
      language: node.config ? 'yaml' : 'json',
      metadata: {
        fileName: node.generatedCodeMetadata?.fileName,
        path: node.generatedCodeMetadata?.path,
        name: node.name,
        type: node.nodeType
      }
    })),
    summary: {
      totalNodes: backendData.nodes.length,
      successfulGenerations: backendData.nodes.length,
      failedGenerations: 0
    }
  };
};

/**
 * Transform API results to storage format: {graphId: {nodeId: generatedCode[]}}
 */
export const transformResultsToStorageFormat = (results: CodegenResults): StoredCodegenData => {
  const storageData: StoredCodegenData = {};

  storageData[results.graphId] = {};

  results.generatedCodes.forEach(generated => {
    storageData[results.graphId][generated.nodeId] = [generated.code];
  });

  return storageData;
};

/**
 * Load generated code from localStorage
 */
export const loadGeneratedCodeFromStorage = (): StoredCodegenData => {
  try {
    const stored = localStorage.getItem(GENERATED_CODE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading generated code from storage:', error);
    return {};
  }
};

/**
 * Save generated code to localStorage and cookies
 */
export const saveGeneratedCodeToStorage = (results: CodegenResults): void => {
  try {
    const storageFormat = transformResultsToStorageFormat(results);

    // Get existing data and merge
    const existingData = loadGeneratedCodeFromStorage();
    const mergedData = { ...existingData, ...storageFormat };

    // Save to localStorage
    localStorage.setItem(GENERATED_CODE_STORAGE_KEY, JSON.stringify(mergedData));

    // Save to cookies (with 30-day expiration)
    const expires = new Date();
    expires.setTime(expires.getTime() + CODEGEN_COOKIE_EXPIRATION_MS);
    document.cookie = `${GENERATED_CODE_STORAGE_KEY}=${JSON.stringify(mergedData)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;

    console.log(`Generated code saved for graph ${results.graphId} with ${results.generatedCodes.length} nodes`);
  } catch (error) {
    console.error('Error saving generated code to storage:', error);
  }
};

/**
 * Clear all generated code from storage
 */
export const clearGeneratedCodeStorage = (): void => {
  try {
    localStorage.removeItem(GENERATED_CODE_STORAGE_KEY);
    // Also clear cookie
    document.cookie = `${GENERATED_CODE_STORAGE_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
    console.log('Generated code storage cleared');
  } catch (error) {
    console.error('Error clearing generated code storage:', error);
  }
};

/**
 * Handle results fetch errors with user-friendly messages
 */
export const handleResultsError = (error: any, callbacks?: EnhancedPollingCallbacks): string => {
  let errorMessage: string;

  if (error.response?.status === 404) {
    errorMessage = 'Results not found. The job may have been deleted or expired.';
  } else if (error.response?.status === 401 || error.response?.status === 403) {
    errorMessage = 'Authentication failed while fetching results. Please log in and try again.';
  } else if (error.response?.status >= 500) {
    errorMessage = 'Server error while fetching results. Please try again in a few moments.';
  } else if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
    errorMessage = 'Network connection failed while fetching results. Please check your connection and try again.';
  } else {
    errorMessage = `Failed to fetch generated code results. Please try again: ${error.message || 'Unknown error'}`;
  }

  callbacks?.onStorageError?.(errorMessage);
  return errorMessage;
};

/**
 * Poll code generation with exponential backoff, UI updates, and cancellation support
 */
export const pollCodeGenerationWithBackoff = async (
  jobId: string,
  config: Partial<PollingConfig> = {},
  callbacks?: PollingCallbacks,
  token?: string,
  abortSignal?: AbortSignal
): Promise<PollingResult> => {
  const finalConfig = { ...defaultConfig, ...config };
  const startTime = Date.now();
  let currentDelay = finalConfig.initialDelay;
  let attempt = 0;
  let lastStatus: string = '';

  try {
    while (true) {
      attempt++;

      // Check for cancellation
      if (abortSignal?.aborted) {
        throw new Error('Polling cancelled by user');
      }

      // Check total time limit
      const elapsed = Date.now() - startTime;
      if (elapsed > finalConfig.maxTotalTime) {
        return {
          success: false,
          status: 'TIMEOUT',
          error: `Code generation timed out after ${Math.round(elapsed / 60000)} minutes`,
          totalAttempts: attempt,
          totalDuration: elapsed,
          finalStatus: lastStatus || 'TIMEOUT'
        };
      }

      // Notify progress
      callbacks?.onProgress?.(attempt, lastStatus || 'POLLING', currentDelay);

      // Wait before polling (except for first attempt)
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, currentDelay));

        // Check for cancellation again after delay
        if (abortSignal?.aborted) {
          throw new Error('Polling cancelled by user');
        }
      }

      try {
        // Poll the status
        const response = await pollCodegenStatus(jobId, token);
        const { status, result } = response;
        lastStatus = status;

        // Notify status change
        if (status !== lastStatus) {
          callbacks?.onStatusChange?.(status);
        }

        // Handle different statuses
        switch (status) {
          case JOB_STATUS.COMPLETED:
            const totalDuration = Date.now() - startTime;

            try {
              // 1. Fetch detailed results from the results API
              const results = await fetchCodegenResults(jobId, token);

              // 2. Notify that results were fetched
              (callbacks as EnhancedPollingCallbacks)?.onResultsFetched?.(results);

              // 3. Store results in localStorage
              saveGeneratedCodeToStorage(results);

              // 4. Notify about code storage
              results.generatedCodes.forEach(generated => {
                (callbacks as EnhancedPollingCallbacks)?.onCodeStored?.(
                  results.graphId,
                  generated.nodeId,
                  [generated.code]
                );
              });

              // 5. Notify completion with detailed results
              callbacks?.onComplete?.(results);

              return {
                success: true,
                status: 'COMPLETED',
                result: results,
                totalAttempts: attempt,
                totalDuration,
                finalStatus: status
              };
            } catch (resultError: any) {
              // Handle results fetch error
              const errorMessage = handleResultsError(resultError, callbacks as EnhancedPollingCallbacks);

              return {
                success: false,
                status: 'ERROR',
                error: errorMessage,
                totalAttempts: attempt,
                totalDuration,
                finalStatus: 'RESULTS_FETCH_FAILED'
              };
            }

          case JOB_STATUS.FAILED:
            const errorDuration = Date.now() - startTime;
            const errorMessage = result?.error || 'Code generation failed. Please try again.';
            callbacks?.onError?.(errorMessage);
            return {
              success: false,
              status: 'ERROR',
              error: errorMessage,
              totalAttempts: attempt,
              totalDuration: errorDuration,
              finalStatus: status
            };

          case JOB_STATUS.PENDING:
          case JOB_STATUS.RUNNING:
            // Continue polling with exponential backoff
            currentDelay = calculateNextDelay(currentDelay, finalConfig);
            break;

          default:
            // Unknown status, continue polling
            console.warn(`Unknown job status: ${status}, continuing to poll`);
            currentDelay = calculateNextDelay(currentDelay, finalConfig);
            break;
        }

        // Check retry limit
        if (finalConfig.maxRetries && attempt >= finalConfig.maxRetries) {
          return {
            success: false,
            status: 'ERROR',
            error: `Maximum retry limit (${finalConfig.maxRetries}) reached`,
            totalAttempts: attempt,
            totalDuration: Date.now() - startTime,
            finalStatus: lastStatus
          };
        }

      } catch (pollError: any) {
        // Handle polling errors (network issues, etc.)
        const errorMessage = handlePollingError(pollError, callbacks);

        // For network errors, continue polling with backoff
        if (pollError.code === 'NETWORK_ERROR' || pollError.code === 'ECONNABORTED') {
          currentDelay = calculateNextDelay(currentDelay, finalConfig);
          continue;
        }

        // For other errors, fail immediately
        return {
          success: false,
          status: 'ERROR',
          error: errorMessage,
          totalAttempts: attempt,
          totalDuration: Date.now() - startTime,
          finalStatus: lastStatus || 'POLLING_ERROR'
        };
      }
    }

  } catch (error: any) {
    // Handle cancellation and other errors
    const totalDuration = Date.now() - startTime;

    if (error.message === 'Polling cancelled by user' || error.name === 'AbortError') {
      return {
        success: false,
        status: 'CANCELLED',
        error: 'Code generation was cancelled.',
        totalAttempts: attempt,
        totalDuration,
        finalStatus: lastStatus || 'CANCELLED'
      };
    }

    const errorMessage = handlePollingError(error, callbacks);
    return {
      success: false,
      status: 'ERROR',
      error: errorMessage,
      totalAttempts: attempt,
      totalDuration,
      finalStatus: lastStatus || 'ERROR'
    };
  }
};

/**
 * End-to-end code generation with polling
 */
export const generateCodeWithPolling = async (
  input: InitiateCodegenInput,
  config: Partial<PollingConfig> = {},
  callbacks?: PollingCallbacks,
  token?: string,
  abortSignal?: AbortSignal
): Promise<PollingResult> => {
  try {
    // 1. Initiate code generation
    callbacks?.onStatusChange?.('Initiating code generation...');
    const jobId = await initiateCodeGeneration(input, token);

    callbacks?.onStatusChange?.(`Job initiated (ID: ${jobId}), starting polling...`);

    // 2. Start polling with backoff
    return await pollCodeGenerationWithBackoff(jobId, config, callbacks, token, abortSignal);

  } catch (error: any) {
    // Handle initiation errors
    const errorMessage = handlePollingError(error, callbacks);
    return {
      success: false,
      status: 'ERROR',
      error: errorMessage,
      totalAttempts: 0,
      totalDuration: 0,
      finalStatus: 'INITIATION_FAILED'
    };
  }
};

/**
 * Enhanced polling function with Redux integration
 */
export const pollCodeGenerationWithRedux = async (
  input: InitiateCodegenInput,
  config: Partial<PollingConfig> = {},
  callbacks?: EnhancedPollingCallbacks,
  token?: string,
  abortSignal?: AbortSignal,
  dispatch?: any
): Promise<PollingResult> => {
  try {
    // 1. Initiate code generation
    callbacks?.onStatusChange?.('Initiating code generation...');
    const jobId = await initiateCodeGeneration(input, token);

    // 2. Start Redux job tracking
    if (dispatch) {
      dispatch(startJobTracking({ jobId, graphId: input.graph.id }));
    }

    callbacks?.onStatusChange?.(`Job initiated (ID: ${jobId}), starting polling...`);

    // 3. Enhanced polling with Redux integration
    const finalConfig = { ...defaultConfig, ...config };
    const startTime = Date.now();
    let currentDelay = finalConfig.initialDelay;
    let attempt = 0;
    let lastStatus: string = '';

    try {
      while (true) {
        attempt++;

        // Check for cancellation
        if (abortSignal?.aborted) {
          if (dispatch) {
            dispatch(cancelJobTracking({ jobId }));
          }
          throw new Error('Polling cancelled by user');
        }

        // Check total time limit
        const elapsed = Date.now() - startTime;
        if (elapsed > finalConfig.maxTotalTime) {
          if (dispatch) {
            dispatch(failJobTracking({
              jobId,
              error: `Code generation timed out after ${Math.round(elapsed / 60000)} minutes`,
              totalAttempts: attempt,
              totalDuration: elapsed
            }));
          }

          return {
            success: false,
            status: 'TIMEOUT',
            error: `Code generation timed out after ${Math.round(elapsed / 60000)} minutes`,
            totalAttempts: attempt,
            totalDuration: elapsed,
            finalStatus: lastStatus || 'TIMEOUT'
          };
        }

        // Notify progress
        callbacks?.onProgress?.(attempt, lastStatus || 'POLLING', currentDelay);

        // Wait before polling (except for first attempt)
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, currentDelay));

          // Check for cancellation again after delay
          if (abortSignal?.aborted) {
            if (dispatch) {
              dispatch(cancelJobTracking({ jobId }));
            }
            throw new Error('Polling cancelled by user');
          }
        }

        try {
          // Poll the status
          const response = await pollCodegenStatus(jobId, token);
          const { status, result } = response;
          lastStatus = status;

          // Update Redux status
          if (dispatch) {
            dispatch(updateJobStatus({ jobId, status }));
          }

          // Notify status change
          if (status !== lastStatus) {
            callbacks?.onStatusChange?.(status);
          }

          // Handle different statuses
          switch (status) {
            case JOB_STATUS.COMPLETED:
              const totalDuration = Date.now() - startTime;

              try {
                // 1. Fetch detailed results from the results API
                const results = await fetchCodegenResults(jobId, token);

                // 2. Notify that results were fetched
                callbacks?.onResultsFetched?.(results);

                // 3. Store results in localStorage
                saveGeneratedCodeToStorage(results);

                // 4. Update Redux with completion
                if (dispatch) {
                  dispatch(completeJobTracking({
                    jobId,
                    results,
                    totalAttempts: attempt,
                    totalDuration
                  }));
                }

                // 5. Notify about code storage
                results.generatedCodes.forEach(generated => {
                  callbacks?.onCodeStored?.(
                    results.graphId,
                    generated.nodeId,
                    [generated.code]
                  );
                });

                // 6. Notify completion with detailed results
                callbacks?.onComplete?.(results);

                return {
                  success: true,
                  status: 'COMPLETED',
                  result: results,
                  totalAttempts: attempt,
                  totalDuration,
                  finalStatus: status
                };
              } catch (resultError: any) {
                // Handle results fetch error
                const errorMessage = handleResultsError(resultError, callbacks);

                if (dispatch) {
                  dispatch(failJobTracking({
                    jobId,
                    error: errorMessage,
                    totalAttempts: attempt,
                    totalDuration: totalDuration
                  }));
                }

                return {
                  success: false,
                  status: 'ERROR',
                  error: errorMessage,
                  totalAttempts: attempt,
                  totalDuration,
                  finalStatus: 'RESULTS_FETCH_FAILED'
                };
              }

            case JOB_STATUS.FAILED:
              const errorDuration = Date.now() - startTime;
              const errorMessage = result?.error || 'Code generation failed. Please try again.';

              if (dispatch) {
                dispatch(failJobTracking({
                  jobId,
                  error: errorMessage,
                  totalAttempts: attempt,
                  totalDuration: errorDuration
                }));
              }

              callbacks?.onError?.(errorMessage);
              return {
                success: false,
                status: 'ERROR',
                error: errorMessage,
                totalAttempts: attempt,
                totalDuration: errorDuration,
                finalStatus: status
              };

            case JOB_STATUS.PENDING:
            case JOB_STATUS.RUNNING:
              // Continue polling with exponential backoff
              currentDelay = calculateNextDelay(currentDelay, finalConfig);
              break;

            default:
              // Unknown status, continue polling
              console.warn(`Unknown job status: ${status}, continuing to poll`);
              currentDelay = calculateNextDelay(currentDelay, finalConfig);
              break;
          }

          // Check retry limit
          if (finalConfig.maxRetries && attempt >= finalConfig.maxRetries) {
            if (dispatch) {
              dispatch(failJobTracking({
                jobId,
                error: `Maximum retry limit (${finalConfig.maxRetries}) reached`,
                totalAttempts: attempt,
                totalDuration: Date.now() - startTime
              }));
            }

            return {
              success: false,
              status: 'ERROR',
              error: `Maximum retry limit (${finalConfig.maxRetries}) reached`,
              totalAttempts: attempt,
              totalDuration: Date.now() - startTime,
              finalStatus: lastStatus
            };
          }

        } catch (pollError: any) {
          // Handle polling errors (network issues, etc.)
          const errorMessage = handlePollingError(pollError, callbacks);

          // For network errors, continue polling with backoff
          if (pollError.code === 'NETWORK_ERROR' || pollError.code === 'ECONNABORTED') {
            currentDelay = calculateNextDelay(currentDelay, finalConfig);
            continue;
          }

          // For other errors, fail immediately
          if (dispatch) {
            dispatch(failJobTracking({
              jobId,
              error: errorMessage,
              totalAttempts: attempt,
              totalDuration: Date.now() - startTime
            }));
          }

          return {
            success: false,
            status: 'ERROR',
            error: errorMessage,
            totalAttempts: attempt,
            totalDuration: Date.now() - startTime,
            finalStatus: lastStatus || 'POLLING_ERROR'
          };
        }
      }

    } catch (error: any) {
      // Handle cancellation and other errors
      const totalDuration = Date.now() - startTime;

      if (error.message === 'Polling cancelled by user' || error.name === 'AbortError') {
        return {
          success: false,
          status: 'CANCELLED',
          error: 'Code generation was cancelled.',
          totalAttempts: attempt,
          totalDuration,
          finalStatus: lastStatus ?? 'CANCELLED'
        };
      }

      const errorMessage = handlePollingError(error, callbacks);

      if (dispatch) {
        dispatch(failJobTracking({
          jobId,
          error: errorMessage,
          totalAttempts: attempt,
          totalDuration
        }));
      }

      return {
        success: false,
        status: 'ERROR',
        error: errorMessage,
        totalAttempts: attempt,
        totalDuration,
        finalStatus: lastStatus || 'ERROR'
      };
    }

  } catch (error: any) {
    // Handle initiation errors
    const errorMessage = handlePollingError(error, callbacks);
    return {
      success: false,
      status: 'ERROR',
      error: errorMessage,
      totalAttempts: 0,
      totalDuration: 0,
      finalStatus: 'INITIATION_FAILED'
    };
  }
};
