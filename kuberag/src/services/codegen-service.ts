/**
 * Code generation service
 * Port of app/services/codegen_service.py
 * Handles job submission, caching, pub/sub orchestration, and background workflow execution
 */

import { v4 as uuidv4 } from 'uuid';
import { dgraphClient } from '../db/client';
import { codegenCheckpointer } from '../state/checkpointer';
import { codegenPubSub } from '../state/pubsub';
import { codegenCache } from '../state/cache';
import { 
  runCodegenWorkflow, 
  getCodegenWorkflowStatus 
} from '../workflows/codegen-workflow';
import { 
  computeGraphHash, 
  validateGraph 
} from '../utils/codegen';
import { Graph } from '../types/graph';
import {
  GeneratedCodeGraph,
  JobStatus,
  JobStatusInput
} from '../types/codegen';
import { ModelProvider, ModelName, JobStatusStatus } from '../types/enums';

// Job status interface
export interface CodegenJobStatus {
  jobId: string;
  status: JobStatusStatus;
  step: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  graphId: string;
  graphName: string;
  companyId: string;
  userId: string;
  modelProvider: ModelProvider;
}

// Job submission options interface
export interface JobSubmissionOptions {
  modelProvider?: ModelProvider;
  modelName?: ModelName;
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
  enableCache?: boolean;
  enableRAG?: boolean;
}

// Background job context interface
export interface BackgroundJobContext {
  threadId: string;
  jobId: string;
  graph: Graph;
  options: JobSubmissionOptions;
  startTime: number;
  userContext?: string[];
}

/**
 * Code generation service class
 * Manages job submission, caching, background processing, and result retrieval
 */
export class CodegenService {
  private readonly dgraphClient = dgraphClient;
  private readonly checkpointer = codegenCheckpointer;
  private readonly pubsub = codegenPubSub;
  private readonly cache = codegenCache;

  // Background job tracking
  private readonly activeJobs = new Map<string, BackgroundJobContext>();
  private readonly jobResults = new Map<string, GeneratedCodeGraph>();

  constructor() {
    // Start background job processor
    this.startJobProcessor();
  }

/**
   * Generate code for a graph using the workflow
   */
  async generateCode(
    graph: Graph, 
    options: JobSubmissionOptions = {},
    userContext?: string[]
  ): Promise<GeneratedCodeGraph> {
    console.info(`Starting code generation for graph: ${graph.name}`);

    try {
      // Validate graph
      const validation = validateGraph(graph);
      if (!validation.isValid) {
        throw new Error(`Graph validation failed: ${validation.errors.join(', ')}`);
      }

      // Create workflow context
      const threadId = uuidv4();
      const context: any = {
        threadId,
        jobId: uuidv4(),
        graph,
        userId: graph.userId,
        companyId: graph.companyId,
        userContext,
        checkpointer: this.checkpointer,
        pubsub: this.pubsub,
        cache: this.cache,
      };

      // Run workflow
      const result = await runCodegenWorkflow(graph, threadId, context, {
        modelProvider: options.modelProvider,
        modelName: options.modelName,
        enableRAG: options.enableRAG,
        enableValidation: true,
        maxRetries: 3,
        timeout: options.timeout || 300000, // 5 minutes default
      });

      if (!result.success) {
        throw new Error(result.error || 'Code generation failed');
      }

      if (!result.generatedCode) {
        throw new Error('No code generated');
      }

      console.info(`✓ Generated ${result.generatedCode.totalFiles} configuration(s)`);
      return result.generatedCode;

    } catch (error) {
      console.error(`Code generation failed for graph ${graph.name}:`, error);
      throw error;
    }
  }

  /**
   * Submit a code generation job to be processed in the background
   */
  async submitJob(
    graph: Graph, 
    options: JobSubmissionOptions = {},
    userContext?: string[]
  ): Promise<JobStatus> {
    const jobId = uuidv4();
    console.info(`Submitting job ${jobId} for graph ${graph.name}`);

    try {
      // Validate graph
      const validation = validateGraph(graph);
      if (!validation.isValid) {
        throw new Error(`Graph validation failed: ${validation.errors.join(', ')}`);
      }

      // Check for cached result
      if (options.enableCache !== false) {
        const cachedResult = await this.checkCache(graph);
        if (cachedResult) {
          console.info(`Cache hit for graph ${graph.name}`);
          
          // Store result for this job
          this.jobResults.set(jobId, cachedResult);
          
          // Publish cached result
          await this.pubsub.publish(`codegen:results:${jobId}`, {
            type: 'completed',
            jobId,
            graphId: graph.id,
            graphName: graph.name,
            cached: true,
            result: cachedResult,
            timestamp: new Date().toISOString(),
          });

          return {
            jobId,
            status: 'completed',
            step: 'completed',
          };
        }
      }

      // Set job as inflight
      const jobStatus: CodegenJobStatus = {
        jobId,
        status: 'pending',
        step: 'queued',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        graphId: graph.id,
        graphName: graph.name,
        companyId: graph.companyId,
        userId: graph.userId,
        modelProvider: options.modelProvider || ModelProvider.claude,
      };

      // Store job status
      await this.cache.set(`job:${jobId}:status`, jobStatus, 3600); // 1 hour TTL

      // Store context in cache if provided
      if (userContext && userContext.length > 0) {
        await this.cache.set(`job:${jobId}:context`, userContext, 3600);
      }

      // Create background job context
      const jobContext: BackgroundJobContext = {
        threadId: uuidv4(),
        jobId,
        graph,
        options: {
          modelProvider: options.modelProvider || ModelProvider.claude,
          modelName: options.modelName,
          priority: options.priority || 'normal',
          timeout: options.timeout || 300000,
          enableCache: options.enableCache !== false,
          enableRAG: options.enableRAG !== false,
        },
        startTime: Date.now(),
        userContext,
      };

      // Track active job
      this.activeJobs.set(jobId, jobContext);

      // Submit to background processor
      await this.submitBackgroundJob(jobContext);

      // Publish job submission event
      await this.pubsub.publish(`codegen:jobs:${jobId}`, {
        type: 'submitted',
        jobId,
        graphId: graph.id,
        graphName: graph.name,
        status: 'pending',
        timestamp: new Date().toISOString(),
      });

      console.info(`✓ Job ${jobId} submitted successfully`);
      
      return {
        jobId,
        status: 'pending',
        step: 'queued',
      };

    } catch (error) {
      console.error(`Failed to submit job ${jobId}:`, error);
      
      // Update job status to failed
      const failedStatus: CodegenJobStatus = {
        jobId,
        status: 'failed',
        step: 'submission_failed',
        error: error instanceof Error ? error.message : String(error),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        graphId: graph.id,
        graphName: graph.name,
        companyId: graph.companyId,
        userId: graph.userId,
        modelProvider: options.modelProvider || ModelProvider.claude,
      };

      await this.cache.set(`job:${jobId}:status`, failedStatus, 3600);
      
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    try {
      // Check if we have an active job
      const activeJob = this.activeJobs.get(jobId);
      if (activeJob) {
        const workflowStatus = await getCodegenWorkflowStatus(activeJob.threadId);
        
        if (workflowStatus) {
          return {
            jobId,
            status: workflowStatus.status as any,
            step: workflowStatus.currentStep,
          };
        }
      }

      // Check cache for job status
      const cachedStatus = await this.cache.get(`job:${jobId}:status`);
      if (cachedStatus) {
        return {
          jobId,
          status: cachedStatus.status as any,
          step: cachedStatus.step,
        };
      }

      // Check for job result
      const result = this.jobResults.get(jobId);
      if (result) {
        return {
          jobId,
          status: 'completed',
          step: 'completed',
        };
      }

      return null;

    } catch (error) {
      console.error(`Failed to get job status for ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Get generated code for a job
   */
  async getGeneratedCode(jobId: string, timeout: number = 30000): Promise<GeneratedCodeGraph | null> {
    try {
      // Check if we have the result cached
      const result = this.jobResults.get(jobId);
      if (result) {
        console.info(`Returning cached result for job ${jobId}`);
        return result;
      }

      // Check if job is still active
      const activeJob = this.activeJobs.get(jobId);
      if (!activeJob) {
        // Job might be completed but result not cached in memory
        // Check Redis cache for completed job result
        const cachedResult = await this.cache.get(`job:${jobId}:result`);
        if (cachedResult) {
          this.jobResults.set(jobId, cachedResult as GeneratedCodeGraph);
          return cachedResult as GeneratedCodeGraph;
        }

        return null;
      }

      // Wait for job completion
      console.info(`Waiting for job ${jobId} completion (timeout: ${timeout}ms)`);
      
      const startTime = Date.now();
      const timeoutMs = timeout;

      // Subscribe to job results
      const subscription = await this.pubsub.subscribe(`codegen:results:${jobId}`);
      
      try {
        for await (const message of subscription) {
          if (message.type === 'completed' && message.result) {
            console.info(`✓ Job ${jobId} completed successfully`);
            this.jobResults.set(jobId, message.result);
            return message.result;
          } else if (message.type === 'failed') {
            console.error(`Job ${jobId} failed: ${message.error}`);
            return null;
          }

          // Check timeout
          if (Date.now() - startTime > timeoutMs) {
            console.warn(`Timeout waiting for job ${jobId}`);
            return null;
          }
        }
      } finally {
        if (subscription.return) {
          await subscription.return();
        }
      }

      return null;

    } catch (error) {
      console.error(`Failed to get generated code for job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const activeJob = this.activeJobs.get(jobId);
      if (!activeJob) {
        console.warn(`Job ${jobId} is not active or does not exist`);
        return false;
      }

      // Cancel workflow
      const cancelled = await this.cancelCodegenWorkflow(activeJob.threadId);
      
      if (cancelled) {
        // Remove from active jobs
        this.activeJobs.delete(jobId);
        
        // Update job status
        const cancelledStatus: CodegenJobStatus = {
          jobId,
          status: 'cancelled',
          step: 'cancelled',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          graphId: activeJob.graph.id,
          graphName: activeJob.graph.name,
          companyId: activeJob.graph.companyId,
          userId: activeJob.graph.userId,
          modelProvider: activeJob.options.modelProvider || ModelProvider.claude,
        };

        await this.cache.set(`job:${jobId}:status`, cancelledStatus, 3600);

        // Publish cancellation event
        await this.pubsub.publish(`codegen:jobs:${jobId}`, {
          type: 'cancelled',
          jobId,
          graphId: activeJob.graph.id,
          graphName: activeJob.graph.name,
          timestamp: new Date().toISOString(),
        });

        console.info(`✓ Job ${jobId} cancelled successfully`);
        return true;
      }

      return false;

    } catch (error) {
      console.error(`Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * List active jobs
   */
  async listActiveJobs(): Promise<JobStatus[]> {
    const jobs: JobStatus[] = [];

    for (const [jobId, context] of this.activeJobs) {
      const status = await this.getJobStatus(jobId);
      if (status) {
        jobs.push(status);
      }
    }

    return jobs;
  }

  /**
   * Get job statistics
   */
  async getJobStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    failed: number;
    cancelled: number;
    cached: number;
  }> {
    const stats = {
      total: 0,
      active: this.activeJobs.size,
      completed: 0,
      failed: 0,
      cancelled: 0,
      cached: this.jobResults.size,
    };

    // Count completed/failed jobs from cache
    // This is a simplified approach - in production you'd use proper analytics

    return stats;
  }

  /**
   * Clear job cache
   */
  async clearJobCache(): Promise<void> {
    try {
      // Clear active jobs
      this.activeJobs.clear();
      
      // Clear results
      this.jobResults.clear();
      
      // Clear Redis cache (implementation depends on your cache service)
      // await this.cache.clear();
      
      console.info('Job cache cleared');
    } catch (error) {
      console.error('Failed to clear job cache:', error);
    }
  }

  /**
   * Check cache for graph
   */
  private async checkCache(graph: Graph): Promise<GeneratedCodeGraph | null> {
    try {
      const graphHash = computeGraphHash(graph);
      const cacheKey = `codegen:cache:${graphHash}`;
      
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached as GeneratedCodeGraph;
      }
      
      return null;
    } catch (error) {
      console.error('Error checking cache:', error);
      return null;
    }
  }

  /**
   * Cache generated code for graph
   */
  private async cacheResult(graphId: string, result: GeneratedCodeGraph): Promise<void> {
    try {
      const graph = await this.dgraphClient.getGraph(graphId);
      if (graph) {
        const graphHash = computeGraphHash(graph);
        const cacheKey = `codegen:cache:${graphHash}`;
        
        // Cache for 1 hour
        await this.cache.set(cacheKey, result, 3600);
        console.info(`Cached result for graph ${graph.name} (hash: ${graphHash})`);
      }
    } catch (error) {
      console.error('Error caching result:', error);
    }
  }

  /**
   * Submit background job to processor
   */
  private async submitBackgroundJob(context: BackgroundJobContext): Promise<void> {
    // In a real implementation, this would use a job queue like Bull or RabbitMQ
    // For now, we'll process it in a separate async task
    setImmediate(() => {
      this.processBackgroundJob(context).catch(error => {
        console.error(`Background job ${context.jobId} failed:`, error);
      });
    });
  }

  /**
   * Process background job
   */
  private async processBackgroundJob(context: BackgroundJobContext): Promise<void> {
    const { jobId, graph, options } = context;
    
    try {
      console.info(`Processing background job ${jobId} for graph ${graph.name}`);
      
      // Update job status to running
      const runningStatus: CodegenJobStatus = {
        jobId,
        status: 'running',
        step: 'processing',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        graphId: graph.id,
        graphName: graph.name,
        companyId: graph.companyId,
        userId: graph.userId,
        modelProvider: options.modelProvider || ModelProvider.claude,
      };

      await this.cache.set(`job:${jobId}:status`, runningStatus, 3600);
      
      // Publish status update
      await this.pubsub.publish(`codegen:jobs:${jobId}`, {
        type: 'started',
        jobId,
        graphId: graph.id,
        graphName: graph.name,
        status: 'running',
        timestamp: new Date().toISOString(),
      });

      // Run workflow
      const result = await this.generateCode(graph, options, context.userContext);
      
      // Cache result
      await this.cacheResult(graph.id, result);
      
      // Store result
      this.jobResults.set(jobId, result);
      
      // Remove from active jobs
      this.activeJobs.delete(jobId);
      
      // Update job status to completed
      const completedStatus: CodegenJobStatus = {
        jobId,
        status: 'completed',
        step: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        graphId: graph.id,
        graphName: graph.name,
        companyId: graph.companyId,
        userId: graph.userId,
        modelProvider: options.modelProvider || ModelProvider.claude,
      };

      await this.cache.set(`job:${jobId}:status`, completedStatus, 3600);
      
      // Publish completion event
      await this.pubsub.publish(`codegen:jobs:${jobId}`, {
        type: 'completed',
        jobId,
        graphId: graph.id,
        graphName: graph.name,
        status: 'completed',
        result,
        timestamp: new Date().toISOString(),
      });

      console.info(`✓ Background job ${jobId} completed successfully`);

    } catch (error) {
      console.error(`Background job ${jobId} failed:`, error);
      
      // Update job status to failed
      const failedStatus: CodegenJobStatus = {
        jobId,
        status: 'failed',
        step: 'failed',
        error: error instanceof Error ? error.message : String(error),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        graphId: graph.id,
        graphName: graph.name,
        companyId: graph.companyId,
        userId: graph.userId,
        modelProvider: options.modelProvider || ModelProvider.claude,
      };

      await this.cache.set(`job:${jobId}:status`, failedStatus, 3600);
      
      // Remove from active jobs
      this.activeJobs.delete(jobId);
      
      // Publish failure event
      await this.pubsub.publish(`codegen:jobs:${jobId}`, {
        type: 'failed',
        jobId,
        graphId: graph.id,
        graphName: graph.name,
        status: 'failed',
        error: failedStatus.error,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Cancel codegen workflow
   */
  private async cancelCodegenWorkflow(threadId: string): Promise<boolean> {
    try {
      const workflow = new (await import('../workflows/codegen-workflow')).CodegenWorkflow();
      return await workflow.cancel(threadId);
    } catch (error) {
      console.error(`Failed to cancel workflow ${threadId}:`, error);
      return false;
    }
  }

  /**
   * Start background job processor
   */
  private startJobProcessor(): void {
    // This would typically start a job queue processor
    // For now, we handle jobs individually in submitBackgroundJob
    console.info('Background job processor started');
  }
}

// Export singleton instance
export const codegenService = new CodegenService();

// Export convenience functions
export async function submitCodegenJob(
  graph: Graph, 
  options?: JobSubmissionOptions
): Promise<JobStatus> {
  return await codegenService.submitJob(graph, options);
}

export async function getCodegenJobStatus(jobId: string): Promise<JobStatus | null> {
  return await codegenService.getJobStatus(jobId);
}

export async function getCodegenJobResult(
  jobId: string, 
  timeout?: number
): Promise<GeneratedCodeGraph | null> {
  return await codegenService.getGeneratedCode(jobId, timeout);
}

export async function cancelCodegenJob(jobId: string): Promise<boolean> {
  return await codegenService.cancelJob(jobId);
}
