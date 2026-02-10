/**
 * Code Generation Service
 * 
 * Business logic layer for code generation functionality.
 * Handles project metadata storage, job management, and RAG system integration.
 */

import {
  graphqlSdk,
  type GraphInput,
  type JobStatus,
  type GenerateCodeInput,
} from '@/clients/rag-client';

// Local extension of GenerateCodeInput to include context field
interface ExtendedGenerateCodeInput extends GenerateCodeInput {
  context?: string[];
}
import { cleanGraphInput } from '@/utils/graph-input-cleaner';
import { db } from '@/db';
import { projects, generationJobs, users, teams } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { CodegenError } from '@/errors/codegen';
import logger from '@/utils/logger';
import { withRetry } from '@/utils/retry';
import type { WebSocketContext } from '@/routes/api/v1/graph/types';
import type { Context } from 'hono';

export class CodegenService {
  private activeSubscriptions = new Map<string, WebSocketContext>();

  /**
   * Store/update project metadata with graph info - FIXED VERSION
   * 
   * @param projectInfo - Project information (ID for existing, name for new)
   * @param graphData - Graph data from RAG system
   * @param userId - User ID making the request
   * @param teamId - Team ID for ownership
   * @returns Promise<Project> - Created/updated project
   */
  async storeProjectMetadata(
    projectInfo: { id?: string; name?: string; description?: string },
    graphData: any,
    userId: number,
    teamId: number
  ): Promise<any> {
    try {
      // Pre-validate and parse project ID to avoid strict mode issues
      const projectId = projectInfo.id ? parseInt(projectInfo.id) : null;
      
      if (projectId && !isNaN(projectId)) {
        // Update existing project using transaction to avoid strict mode issues
        console.log('Updating existing project with ID:', projectId);
        
        const result = await db.transaction(async (tx) => {
          // Update project basic info - .returning() gives us the full row including graphMeta
          const [project] = await tx.update(projects)
            .set({
              name: projectInfo.name || `Graph Project ${Date.now()}`,
              teamId: teamId,
              updatedAt: new Date()
            })
            .where(eq(projects.id, projectId))
            .returning();

          if (project) {
            try {
              const currentMeta = project.graphMeta ? JSON.parse(project.graphMeta) : {};
              const updatedMeta = {
                ...currentMeta,
                lastUpdated: new Date().toISOString(),
                graphData: graphData,
                description: projectInfo.description || currentMeta.description
              };

              await tx.update(projects)
                .set({
                  graphMeta: JSON.stringify(updatedMeta),
                  updatedAt: new Date()
                })
                .where(eq(projects.id, projectId));
            } catch (parseError) {
              console.error('Error parsing project metadata:', parseError);
              // Create new metadata if parsing fails
              await tx.update(projects)
                .set({
                  graphMeta: JSON.stringify({
                    description: projectInfo.description,
                    graphType: graphData.graphType,
                    companyId: graphData.companyId,
                    graphData: graphData,
                    nodes: graphData.nodes?.length || 0,
                    lastUpdated: new Date().toISOString()
                  }),
                  updatedAt: new Date()
                })
                .where(eq(projects.id, projectId));
            }
          }

          return project;
        });

        return result;
        
      } else {
        // Create new project
        console.log('Creating new project');
        
        const graphId = this.generateGraphId();
        const projectMeta = {
          description: projectInfo.description,
          graphType: graphData.graphType,
          companyId: graphData.companyId,
          graphData: graphData,
          nodes: graphData.nodes?.length || 0,
          createdAt: new Date().toISOString()
        };

        const [project] = await db.insert(projects).values({
          name: projectInfo.name || `Graph Project ${Date.now()}`,
          graphId: graphId,
          graphMeta: JSON.stringify(projectMeta),
          teamId: teamId,
          createdBy: userId
        }).returning();

        return project;
      }
    } catch (error) {
      console.error('Error in storeProjectMetadata:', error);
      // Enhanced error handling with more context
      if ((error as Error).message && (error as Error).message.includes('arguments') && (error as Error).message.includes('callee')) {
        // This is a strict mode error
        throw new CodegenError(
          'Strict mode error encountered. This is likely a library compatibility issue. Please try restarting the server or using the alternative database configuration.',
          graphData,
          {
            isServerError: false
          }
        );
      }
      
      throw new CodegenError(
        `Failed to store project metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        graphData,
        {
          isServerError: false
        }
      );
    }
  }

  /**
   * Create job linked to both project and graph
   * 
   * @param jobId - Job ID from RAG system
   * @param graphId - RAG system graph ID
   * @param projectId - Local project ID for permissions
   * @param userId - User ID requesting the generation
   * @param config - Generation configuration
   * @returns Promise<GenerationJob> - Created job record
   */
  async storeJobMetadata(
    jobId: string,
    graphId: string,
    projectId: number,
    userId: number,
    config: any
  ): Promise<any> {
    try {
      const [job] = await db.insert(generationJobs).values({
        uuid: jobId,
        graphId: graphId, // RAG system graph ID
        projectId: projectId, // Local project ID
        requestedBy: userId,
        status: 'pending',
        config: JSON.stringify(config),
        progress: 0
      }).returning();

      return job;
    } catch (error) {
      throw new CodegenError('Failed to store job metadata', config.graph, {
        isServerError: false
      });
    }
  }

  /**
   * Initialize code generation with RAG system
   * 
   * @param config - Code generation configuration
   * @returns Promise<{jobId: string; projectId: number}> - Job info
   */
  async initializeCodeGeneration(config: {
    graph: GraphInput;
    project: any;
    llmConfig?: any;
    context?: string[];
  }): Promise<JobStatus & { projectId: number }> {
    return await CodegenError.withRetry(async () => {
      try {
        // Initializing with original graph to print in debug logs if needed, but using cleaned input for mutation
        const cleanGraph = cleanGraphInput(config.graph);

        const input: ExtendedGenerateCodeInput = {
          graph: cleanGraph,
          llmConfig: config.llmConfig ? {
            ...config.llmConfig,
            provider: config.llmConfig.provider?.toLowerCase(),
          } : undefined,
          context: config.context
        };

        const result = await graphqlSdk.InitializeCodeGen({
          input
        });

        if (result.errors?.length) {
          throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
        }

        if (!result.data?.initializeCodeGen) {
          throw new Error('No data returned from initializeCodeGen mutation');
        }

        const jobStatus = result.data.initializeCodeGen;

        return {
          ...jobStatus,
          projectId: config.project?.id ? parseInt(config.project.id) : 0
        };
      } catch (error) {
        throw error;
      }
    }, config.graph as any);
  }

  /**
   * Get job by Job ID with permission check
   * 
   * @param jobId - Job UUID from RAG system
   * @param userId - User ID making the request
   * @returns Promise<GenerationJob | null> - Job if user has access
   */
  async getJobByJobId(jobId: string, userId: number): Promise<any | null> {
    try {
      const [job] = await db.select()
        .from(generationJobs)
        .where(eq(generationJobs.uuid, jobId))
        .limit(1);

      if (!job) return null;

      // Get the project to check team ownership
      const [project] = await db.select()
        .from(projects)
        .where(eq(projects.id, job.projectId))
        .limit(1);

      if (!project) return null;

      // Check user can access project
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Team member check
      if (!user || user.teamId !== project.teamId) {
        return null;
      }

      return { ...job, project };
    } catch (error) {
      console.error('Failed to get job by ID:', error);
      return null;
    }
  }

  /**
   * Get current job status from RAG system
   * 
   * @param jobId - Job UUID
   * @returns Promise<JobStatus> - Current job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    return await withRetry(async () => {
      const result = await graphqlSdk.JobStatus({
        input: { jobId }
      });

      if (result.errors?.length) {
        throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
      }

      if (!result.data?.jobStatus) {
        throw new Error('No data returned from jobStatus query');
      }

      return result.data.jobStatus;
    }, {
      maxRetries: 3,
      isRetryable: (error) => {
        // Retry on server errors and timeouts
        return error.response?.status >= 500 ||
          /network|timeout|connection/i.test(error.message);
      }
    });
  }

  async getJobResults(
    c: Context,
    jobId: string,
    userId: number
  ): Promise<any> {
    const job = await this.getJobByJobId(jobId, userId);
    if (!job) {
      throw new CodegenError('Job not found', { jobId } as any);
    }

    return await withRetry(async () => {
      const result = await graphqlSdk.GenerateCode({
        jobId: jobId
      });

      if (result.errors?.length) {
        throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
      }

      if (!result.data?.generatedCode) {
        throw new Error('No data returned from generateCode query');
      }

      return result.data.generatedCode;
    }, {
      maxRetries: 3,
      isRetryable: (error) => {
        return error.response?.status >= 500 ||
          /network|timeout|connection/i.test(error.message);
      }
    });
  }

  /**
   * Update job progress in database
   * 
   * @param jobId - Job UUID
   * @param generatedCode - Generated code data
   */
  private async updateJobProgress(jobId: string, generatedCode: any) {
    try {
      const progress = Math.min((generatedCode.nodes?.length || 0) * 10, 100); // Simple progress calculation

      await db.update(generationJobs)
        .set({
          status: 'running',
          progress: progress,
          resultData: JSON.stringify(generatedCode),
          updatedAt: new Date()
        })
        .where(eq(generationJobs.uuid, jobId));

      logger.info('Updated job progress', { jobId, progress });
    } catch (error) {
      console.error('Failed to update job progress:', error);
    }
  }

  /**
   * Update job status in database
   * 
   * @param jobId - Job UUID
   * @param status - New job status
   */
  private async updateJobStatus(jobId: string, status: string) {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (status === 'completed') {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      }

      await db.update(generationJobs)
        .set(updateData)
        .where(eq(generationJobs.uuid, jobId));

      logger.info('Updated job status', { jobId, status });
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  }

  /**
   * Send updates to WebSocket client
   * 
   * @param c - Hono context with WebSocket
   * @param generatedCode - Generated code data
   */
  private sendWebSocketUpdate(c: any, generatedCode: any) {
    if (c.ws?.send) {
      c.ws.send(JSON.stringify({
        type: 'update',
        data: generatedCode
      }));
    }
  }

  /**
   * Send error to WebSocket client
   * 
   * @param c - Hono context with WebSocket
   * @param error - Error object
   */
  private sendWebSocketError(c: any, error: Error) {
    if (c.ws?.send) {
      c.ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  }

  /**
   * Send completion signal to WebSocket client
   * 
   * @param c - Hono context with WebSocket
   */
  private sendWebSocketComplete(c: any) {
    if (c.ws?.send) {
      c.ws.send(JSON.stringify({
        type: 'complete'
      }));
    }
  }

  /**
   * Cleanup WebSocket subscription
   * 
   * @param jobId - Job ID to cleanup
   */
  async cleanupSubscription(jobId: string) {
    const wsContext = this.activeSubscriptions.get(jobId);
    if (wsContext) {
      if (wsContext.unsubscribe) {
        wsContext.unsubscribe();
      }
      if (wsContext.subscriptionClient) {
        wsContext.subscriptionClient.dispose();
      }
      this.activeSubscriptions.delete(jobId);
      logger.info('Cleaned up WebSocket subscription', { jobId });
    }
  }

  /**
   * Generate UUID for graph ID
   * 
   * @returns string - Generated UUID
   */
  private generateGraphId(): string {
    return `graph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
