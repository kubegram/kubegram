import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { JOB_STATUS, type JobStatusStatus } from '@kubegram/common-ts';
import { 
  type CodegenResults, 
  type GeneratedCode, 
  type StoredCodegenData, 
  fetchCodegenResults,
  saveGeneratedCodeToStorage,
  loadGeneratedCodeFromStorage,
  clearGeneratedCodeStorage
} from '@/store/api/codegen';

/**
 * Code generation job tracking interface
 */
export interface CodegenJob {
  jobId: string;
  graphId: string;
  status: JobStatusStatus;
  startTime: number;
  endTime?: number;
  totalAttempts?: number;
  totalDuration?: number;
}

/**
 * Code generation state interface
 */
export interface CodegenState {
  // Stored generated code in the required format
  storedCode: StoredCodegenData;
  
  // Active job tracking
  activeJobs: Record<string, CodegenJob>;
  
  // Job history
  jobHistory: CodegenJob[];
  
  // Loading states
  isLoading: boolean;
  isFetchingResults: boolean;
  
  // Error states
  error: string | null;
  resultsError: string | null;
  
  // Statistics
  totalJobsCompleted: number;
  totalCodeGenerated: number;
}

/**
 * Initial state
 */
const initialState: CodegenState = {
  storedCode: loadGeneratedCodeFromStorage(),
  activeJobs: {},
  jobHistory: [],
  isLoading: false,
  isFetchingResults: false,
  error: null,
  resultsError: null,
  totalJobsCompleted: 0,
  totalCodeGenerated: 0,
};

/**
 * Async thunk to fetch and store results for a completed job
 */
export const fetchAndStoreResults = createAsyncThunk(
  'codegen/fetchAndStoreResults',
  async (
    { jobId, token }: { jobId: string; token?: string },
    { rejectWithValue }
  ) => {
    try {
      // Fetch results from API
      const results = await fetchCodegenResults(jobId, token);
      
      // Save to storage
      saveGeneratedCodeToStorage(results);
      
      return results;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch results');
    }
  }
);

/**
 * Code generation slice
 */
export const codegenSlice = createSlice({
  name: 'codegen',
  initialState,
  reducers: {
    /**
     * Start tracking a new code generation job
     */
    startJobTracking: (state, action: PayloadAction<{ jobId: string; graphId: string }>) => {
      const { jobId, graphId } = action.payload;
      
      state.activeJobs[jobId] = {
        jobId,
        graphId,
        status: JOB_STATUS.PENDING,
        startTime: Date.now(),
      };
      
      state.isLoading = true;
      state.error = null;
    },
    
    /**
     * Update job status during polling
     */
    updateJobStatus: (state, action: PayloadAction<{ jobId: string; status: JobStatusStatus }>) => {
      const { jobId, status } = action.payload;
      
      if (state.activeJobs[jobId]) {
        state.activeJobs[jobId].status = status;
      }
    },
    
    /**
     * Complete job tracking with results
     */
    completeJobTracking: (
      state, 
      action: PayloadAction<{
        jobId: string;
        results: CodegenResults;
        totalAttempts: number;
        totalDuration: number;
      }>
    ) => {
      const { jobId, results, totalAttempts, totalDuration } = action.payload;
      
      if (state.activeJobs[jobId]) {
        const job = state.activeJobs[jobId];
        
        // Update job with completion data
        job.status = JOB_STATUS.COMPLETED;
        job.endTime = Date.now();
        job.totalAttempts = totalAttempts;
        job.totalDuration = totalDuration;
        
        // Store generated code
        if (!state.storedCode[results.graphId]) {
          state.storedCode[results.graphId] = {};
        }
        
        results.generatedCodes.forEach((generated: GeneratedCode) => {
          state.storedCode[results.graphId][generated.nodeId] = [generated.code];
        });
        
        // Move to history
        state.jobHistory.unshift({ ...job });
        if (state.jobHistory.length > 100) {
          state.jobHistory = state.jobHistory.slice(0, 100);
        }
        
        // Remove from active jobs
        delete state.activeJobs[jobId];
        
        // Update statistics
        state.totalJobsCompleted++;
        state.totalCodeGenerated += results.generatedCodes.length;
      }
      
      state.isLoading = false;
      state.isFetchingResults = false;
    },
    
    /**
     * Handle job failure
     */
    failJobTracking: (
      state,
      action: PayloadAction<{
        jobId: string;
        error: string;
        totalAttempts: number;
        totalDuration: number;
      }>
    ) => {
      const { jobId, error, totalAttempts, totalDuration } = action.payload;
      
      if (state.activeJobs[jobId]) {
        const job = state.activeJobs[jobId];
        
        // Update job with failure data
        job.status = JOB_STATUS.FAILED;
        job.endTime = Date.now();
        job.totalAttempts = totalAttempts;
        job.totalDuration = totalDuration;
        
        // Move to history
        state.jobHistory.unshift({ ...job });
        if (state.jobHistory.length > 100) {
          state.jobHistory = state.jobHistory.slice(0, 100);
        }
        
        // Remove from active jobs
        delete state.activeJobs[jobId];
      }
      
      state.isLoading = false;
      state.isFetchingResults = false;
      state.error = error;
    },
    
    /**
     * Cancel job tracking
     */
    cancelJobTracking: (state, action: PayloadAction<{ jobId: string }>) => {
      const { jobId } = action.payload;
      
      if (state.activeJobs[jobId]) {
        const job = state.activeJobs[jobId];
        
        // Update job with cancellation data
        job.status = JOB_STATUS.CANCELLED;
        job.endTime = Date.now();
        
        // Move to history
        state.jobHistory.unshift({ ...job });
        if (state.jobHistory.length > 100) {
          state.jobHistory = state.jobHistory.slice(0, 100);
        }
        
        // Remove from active jobs
        delete state.activeJobs[jobId];
      }
      
      state.isLoading = false;
      state.isFetchingResults = false;
    },
    
    /**
     * Set generated code directly (for manual updates)
     */
    setGeneratedCode: (
      state,
      action: PayloadAction<{ graphId: string; nodeId: string; codes: string[] }>
    ) => {
      const { graphId, nodeId, codes } = action.payload;
      
      if (!state.storedCode[graphId]) {
        state.storedCode[graphId] = {};
      }
      
      state.storedCode[graphId][nodeId] = codes;
    },
    
    /**
     * Clear generated code for a specific graph
     */
    clearGeneratedCode: (state, action: PayloadAction<{ graphId?: string }>) => {
      const { graphId } = action.payload;
      
      if (graphId) {
        delete state.storedCode[graphId];
      } else {
        state.storedCode = {};
      }
    },
    
    /**
     * Clear all code generation data
     */
    clearAllCodegenData: (state) => {
      state.storedCode = {};
      state.activeJobs = {};
      state.jobHistory = [];
      state.error = null;
      state.resultsError = null;
      state.totalJobsCompleted = 0;
      state.totalCodeGenerated = 0;
      
      // Also clear storage
      clearGeneratedCodeStorage();
    },
    
    /**
     * Set error state
     */
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    
    /**
     * Set results error state
     */
    setResultsError: (state, action: PayloadAction<string>) => {
      state.resultsError = action.payload;
      state.isFetchingResults = false;
    },
    
    /**
     * Clear errors
     */
    clearErrors: (state) => {
      state.error = null;
      state.resultsError = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(fetchAndStoreResults.pending, (state) => {
        state.isFetchingResults = true;
        state.resultsError = null;
      })
      .addCase(fetchAndStoreResults.fulfilled, (state, action) => {
        state.isFetchingResults = false;
        state.resultsError = null;
        
        // Store the results
        const results = action.payload;
        if (!state.storedCode[results.graphId]) {
          state.storedCode[results.graphId] = {};
        }
        
        results.generatedCodes.forEach((generated: GeneratedCode) => {
          state.storedCode[results.graphId][generated.nodeId] = [generated.code];
        });
        
        // Update statistics
        state.totalCodeGenerated += results.generatedCodes.length;
      })
      .addCase(fetchAndStoreResults.rejected, (state, action) => {
        state.isFetchingResults = false;
        state.resultsError = action.payload as string;
      });
  },
});

/**
 * Export actions
 */
export const {
  startJobTracking,
  updateJobStatus,
  completeJobTracking,
  failJobTracking,
  cancelJobTracking,
  setGeneratedCode,
  clearGeneratedCode,
  clearAllCodegenData,
  setError,
  setResultsError,
  clearErrors,
} = codegenSlice.actions;

/**
 * Export reducer
 */
export default codegenSlice.reducer;

/**
 * Selectors
 */
export const selectCodegenState = (state: { codegen: CodegenState }) => state.codegen;

export const selectStoredCode = (state: { codegen: CodegenState }) => state.codegen.storedCode;

export const selectGeneratedCodeForGraph = (
  state: { codegen: CodegenState },
  graphId: string
) => state.codegen.storedCode[graphId] || {};

export const selectGeneratedCodeForNode = (
  state: { codegen: CodegenState },
  graphId: string,
  nodeId: string
) => state.codegen.storedCode[graphId]?.[nodeId] || [];

export const selectActiveJobs = (state: { codegen: CodegenState }) => state.codegen.activeJobs;

export const selectJobHistory = (state: { codegen: CodegenState }) => state.codegen.jobHistory;

export const selectCodegenLoading = (state: { codegen: CodegenState }) => state.codegen.isLoading;

export const selectCodegenError = (state: { codegen: CodegenState }) => state.codegen.error;

export const selectCodegenStats = (state: { codegen: CodegenState }) => ({
  totalJobsCompleted: state.codegen.totalJobsCompleted,
  totalCodeGenerated: state.codegen.totalCodeGenerated,
  activeJobsCount: Object.keys(state.codegen.activeJobs).length,
});
