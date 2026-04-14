/**
 * Code Generation Service
 * 
 * Business logic layer for code generation functionality.
 * Handles project metadata storage, job management, and RAG system integration.
 */

import type { GraphInput } from '@/clients/rag-client';
import { cleanGraphInput } from '@/utils/graph-input-cleaner';
import { mapToWorkflowGraph } from '@/utils/graph-mapper';
import { workflowService } from '@/services/workflow';
import type { WorkflowContext, CodegenWorkflowOptions } from '@kubegram/kubegram-core';
import { db } from '@/db';
import { projects, generationJobs, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CodegenError } from '@/errors/codegen';
import logger from '@/utils/logger';
import config from '@/config/env';
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
    projectInfo: {
      id?: string;
      name?: string;
      description?: string;
      githubInstallationId?: number;
      githubOwner?: string;
      githubRepo?: string;
      githubBaseBranch?: string;
      argocdAppName?: string;
    },
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
          // Build update payload; only include GitHub fields if provided
          const updateSet: Record<string, unknown> = {
            name: projectInfo.name || `Graph Project ${Date.now()}`,
            teamId: teamId,
            updatedAt: new Date(),
          };
          if (projectInfo.githubInstallationId !== undefined) updateSet.githubInstallationId = projectInfo.githubInstallationId;
          if (projectInfo.githubOwner !== undefined) updateSet.githubOwner = projectInfo.githubOwner;
          if (projectInfo.githubRepo !== undefined) updateSet.githubRepo = projectInfo.githubRepo;
          if (projectInfo.githubBaseBranch !== undefined) updateSet.githubBaseBranch = projectInfo.githubBaseBranch;
          if (projectInfo.argocdAppName !== undefined) updateSet.argocdAppName = projectInfo.argocdAppName;

          // Update project basic info - .returning() gives us the full row including graphMeta
          const [project] = await tx.update(projects)
            .set(updateSet as any)
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
          createdBy: userId,
          ...(projectInfo.githubInstallationId !== undefined && { githubInstallationId: projectInfo.githubInstallationId }),
          ...(projectInfo.githubOwner !== undefined && { githubOwner: projectInfo.githubOwner }),
          ...(projectInfo.githubRepo !== undefined && { githubRepo: projectInfo.githubRepo }),
          ...(projectInfo.githubBaseBranch !== undefined && { githubBaseBranch: projectInfo.githubBaseBranch }),
          ...(projectInfo.argocdAppName !== undefined && { argocdAppName: projectInfo.argocdAppName }),
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
   * Initialize code generation using kubegram-core workflow.
   * Generates a server-side jobId, starts the workflow in the background,
   * and returns immediately so the caller can store job metadata and respond.
   *
   * @param config - Code generation configuration
   * @returns { jobId, step, status, projectId }
   */
  async initializeCodeGeneration(config: {
    graph: GraphInput;
    project: any;
    llmConfig?: any;
    context?: string[];
  }): Promise<{ jobId: string; step: string; status: string; projectId: number }> {
    const cleanGraph = cleanGraphInput(config.graph);

    // Generate job ID server-side; used as both the workflow threadId and DB uuid
    const jobId = crypto.randomUUID();

    // Map to kubegram-core Graph, anchoring the graph ID to the jobId
    const coreGraph = mapToWorkflowGraph(cleanGraph as any, jobId);

    const workflowContext: WorkflowContext = {
      threadId: jobId,
      jobId,
      userId: String(config.graph.userId ?? ''),
      companyId: String(config.graph.companyId ?? ''),
      userContext: config.context ?? [],
    };

    const workflowOptions: CodegenWorkflowOptions = {
      modelProvider: config.llmConfig?.provider as any,
      modelName: config.llmConfig?.model,
      enableRAG: false,
      enableValidation: true,
    };

    await workflowService.initialize();
    await workflowService.startCodegen(coreGraph, jobId, workflowContext, workflowOptions);

    return {
      jobId,
      step: 'getOrCreateGraph',
      status: 'running',
      projectId: config.project?.id ? parseInt(config.project.id) : 0,
    };
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
   * Get current job status from the kubegram-core EventCache (live workflow state)
   * or fall back to the DB record for completed / old jobs.
   *
   * @param jobId - Job UUID (= workflow threadId)
   * @returns { jobId, step, status }
   */
  async getJobStatus(jobId: string): Promise<{ jobId: string; step: string; status: string }> {
    await workflowService.initialize();
    const workflowState = await workflowService.getStatus(jobId);

    if (workflowState) {
      return {
        jobId,
        step: workflowState.currentStep,
        status: workflowState.status,
      };
    }

    // EventCache expired or job never started via workflow — fall back to DB
    const [job] = await db.select()
      .from(generationJobs)
      .where(eq(generationJobs.uuid, jobId))
      .limit(1);

    if (!job) {
      throw new CodegenError('Job not found', { jobId } as any);
    }

    return { jobId, step: job.status, status: job.status };
  }

  async getJobResults(
    _c: Context,
    jobId: string,
    userId: number
  ): Promise<any> {
    const job = await this.getJobByJobId(jobId, userId);
    if (!job) {
      throw new CodegenError('Job not found', { jobId } as any);
    }

    if (job.status !== 'completed' || !job.resultData) {
      throw new CodegenError('Results not yet available', { jobId } as any, { isServerError: false });
    }

    return JSON.parse(job.resultData);
  }

  /**
   * Fire-and-forget: call the GitHub App to open a PR with generated manifests.
   * Updates the job's githubPrUrl in the DB on success (duplicate guard).
   *
   * @param job - Job record (must include job.project with GitHub fields)
   * @param results - Generated code results from the RAG system
   */
  async triggerGitHubPR(job: any, results: any): Promise<void> {
    const project = job.project;
    if (!project?.githubInstallationId || !project?.githubOwner || !project?.githubRepo) return;

    // Extract files from results; each node may contain generated YAML
    const files: Array<{ path: string; content: string }> = [];
    if (results?.nodes) {
      for (const node of results.nodes) {
        if (node.generatedCode) {
          const fileName = `${(node.name || node.id || 'resource').toLowerCase().replace(/[^a-z0-9-]/g, '-')}.yaml`;
          files.push({ path: `k8s/${fileName}`, content: node.generatedCode });
        }
      }
    }

    if (files.length === 0) {
      logger.warn('No generated files to include in PR', { jobId: job.uuid });
      return;
    }

    const payload = {
      installationId: project.githubInstallationId,
      owner: project.githubOwner,
      repo: project.githubRepo,
      baseBranch: project.githubBaseBranch || 'main',
      prTitle: `feat: update Kubernetes manifests (job ${job.uuid.slice(0, 8)})`,
      prBody: `Generated by Kubegram codegen job \`${job.uuid}\`.\n\nReview and merge to apply changes to the cluster.`,
      files,
    };

    const res = await fetch(`${config.githubAppUrl}/api/kubegram/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kubegram-Secret': config.kubegramInternalSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`GitHub App returned ${res.status}`);
    }

    const { prUrl } = await res.json() as { prUrl: string };

    // Store the PR URL to prevent duplicate creation on subsequent status polls
    await db.update(generationJobs)
      .set({ githubPrUrl: prUrl, updatedAt: new Date() })
      .where(eq(generationJobs.uuid, job.uuid));

    logger.info('GitHub PR created for job', { jobId: job.uuid, prUrl });
  }

  /**
   * Cleanup WebSocket subscription and cancel the running workflow (if any).
   *
   * @param jobId - Job ID to cleanup
   */
  async cleanupSubscription(jobId: string) {
    // Cancel the kubegram-core workflow if it is still running
    workflowService.initialize().then(() => workflowService.cancel(jobId)).catch(() => {});

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
   */
  private generateGraphId(): string {
    return `graph_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
