/**
 * Code Generation Routes
 * 
 * REST API endpoints for code generation functionality.
 * Handles project metadata storage, job management, and real-time updates.
 */

import { Hono } from 'hono';
import * as v from 'valibot';
import {
  graphqlSdk,
  type GraphInput,
  type JobStatus,
  type GeneratedCodeGraph,
  type GraphType
} from '@/clients/rag-client';
import { db } from '@/db';
import { generationJobs, projects, users } from '@/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { CodegenService } from '@/services/codegen';
import { GraphPermissions } from '@/services/permissions';
import { CodegenError } from '@/errors/codegen';
import {
  CodeGenerationRequestSchema,
  CodeGenerationResponseSchema,
  JobStatusResponseSchema,
  type WebSocketContext
} from './types';
import logger from '@/utils/logger';
import { type AuthContext } from '@/middleware/auth';
// TODO: Fix import - JOB_STATUS not available in common-ts
// import { JOB_STATUS, normalizeJobStatus } from '@kubegram/common-ts';

// Temporary job status constants
const JOB_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running', 
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;

function normalizeJobStatus(status: string): string {
  return status.toLowerCase();
}

type Variables = {
  auth: AuthContext;
};

const codegenRoutes = new Hono<{ Variables: Variables }>();

/**
 * POST /api/public/v1/graph/codegen
 * Initialize code generation for a graph
 */
codegenRoutes.post('/', async (c) => {
  logger.info('Codegen POST handler called');
  try {
    const auth = c.get('auth');
    logger.info('Auth context retrieved', { userId: auth.user.id });

    // Extract teamId from header
    // Extract teamId from header or auth context
    const teamIdHeader = c.req.header('X-Kubegram-Team-Id');
    let teamId: number;

    if (teamIdHeader) {
      teamId = parseInt(teamIdHeader);
      if (isNaN(teamId)) {
        return c.json({
          error: 'Invalid X-Kubegram-Team-Id header value'
        }, 400);
      }
    } else if (auth.user.teamId) {
      teamId = auth.user.teamId;
      logger.info('Using teamId from auth context', { teamId });
    } else {
      return c.json({
        error: 'Missing X-Kubegram-Team-Id header and no team associated with user'
      }, 400);
    }

    const body = await c.req.json();

    // Validate request body
    const validatedBody = v.parse(CodeGenerationRequestSchema, body);

    // Initialize code generation service
    const codegenService = new CodegenService();

    // Validate user permissions using header teamId
    const hasPermission = await GraphPermissions.canCreateProjects(
      parseInt(auth.user.id),
      teamId
    );

    if (!hasPermission) {
      return c.json({
        error: 'Insufficient permissions to create projects in this team'
      }, 403);
    }

    const projectPojo = {
      ...validatedBody.project,
    }

    // Store/update project metadata and validate team membership
    const project = await codegenService.storeProjectMetadata(
      projectPojo,
      validatedBody.graph,
      parseInt(auth.user.id),
      teamId
    );

    // Initialize code generation with RAG system
    const jobStatus = await codegenService.initializeCodeGeneration({
      graph: {
        ...validatedBody.graph,
        graphType: validatedBody.graph.graphType as GraphType
      },
      project: validatedBody.project,
      llmConfig: validatedBody.llmConfig,
      context: validatedBody.context
    });

    logger.info('Initialized codegen job', { jobId: jobStatus.jobId, userId: auth.user.id });

    // Store job metadata
    await codegenService.storeJobMetadata(
      jobStatus.jobId,
      jobStatus.jobId, // graphId = jobId from RAG system
      project.id,
      parseInt(auth.user.id),
      validatedBody
    );

    const response = v.parse(CodeGenerationResponseSchema, jobStatus);
    return c.json(response, 201);

  } catch (error) {
    if (error instanceof CodegenError) {
      return c.json({
        error: error.message,
        graph: error.graph
      }, 400);
    }

    if (error instanceof v.ValiError) {
      return c.json({
        error: 'Validation error',
        details: error.message
      }, 400);
    }

    logger.error('Code generation initialization error', { error });
    return c.json({
      error: 'Internal server error'
    }, 500);
  }
});

/**
 * GET /api/public/v1/graph/codegen/:jobId/status
 * Get status of a code generation job
 */
codegenRoutes.get('/:jobId/status', async (c) => {
  try {
    const auth = c.get('auth');
    const jobId = c.req.param('jobId');

    const codegenService = new CodegenService();

    // Verify user has access to this job
    const hasPermission = await GraphPermissions.canAccessJob(parseInt(auth.user.id), jobId);

    if (!hasPermission) {
      return c.json({ error: 'Job not found or access denied' }, 404);
    }

    // Get current status from RAG system
    const status = await codegenService.getJobStatus(jobId);

    const normalizedStatus = normalizeJobStatus(status.status);
    const canonicalStatus = normalizedStatus ?? status.status;
    let responseData: any = { ...status, status: canonicalStatus };

    // If job is complete, fetch results
    if (canonicalStatus === JOB_STATUS.COMPLETED) {
      const results = await codegenService.getJobResults(c, jobId, parseInt(auth.user.id));
      responseData.generatedCode = results;
    }

    const response = v.parse(JobStatusResponseSchema, responseData);
    return c.json(response);

  } catch (error) {
    logger.error('Get job status error', { error });
    return c.json({ error: 'Failed to get job status' }, 500);
  }
});

/**
 * GET /api/public/v1/graph/codegen/:jobId/results
 * Get generated code results for a completed job
 */
codegenRoutes.get('/:jobId/results', async (c) => {
  try {
    const auth = c.get('auth');
    const jobId = c.req.param('jobId');

    const codegenService = new CodegenService();

    // Verify user has access to this job
    const hasPermission = await GraphPermissions.canAccessJob(parseInt(auth.user.id), jobId);

    if (!hasPermission) {
      return c.json({ error: 'Job not found or access denied' }, 404);
    }

    // Get current job status
    const status = await codegenService.getJobStatus(jobId);
    const canonicalStatus = normalizeJobStatus(status.status) ?? status.status;

    // Check if job is completed
    if (canonicalStatus !== JOB_STATUS.COMPLETED) {
      return c.json({
        error: 'Job not completed',
        status: canonicalStatus,
        message: 'Results are only available for completed jobs'
      }, 400);
    }

    // Fetch generated code results
    const results = await codegenService.getJobResults(c, jobId, parseInt(auth.user.id));

    return c.json({
      jobId: jobId,
      status: canonicalStatus,
      generatedCode: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof CodegenError) {
      logger.error('Code generation error in results', { error: error.toJSON() });
      return c.json({
        error: error.message,
        graph: error.graph,
        retryable: error.retryable
      }, error.isServerError ? 502 : 400);
    }

    if (error instanceof v.ValiError) {
      logger.error('Validation error in results', { error });
      return c.json({
        error: 'Validation error',
        details: error.message
      }, 400);
    }

    logger.error('Get job results error', { error });
    return c.json({ error: 'Failed to get job results' }, 500);
  }
});

/**
 * GET /api/public/v1/graph/codegen/jobs
 * List all jobs for the authenticated user
 */
codegenRoutes.get('/jobs', async (c) => {
  try {
    const auth = c.get('auth');
    const userProjects = await GraphPermissions.getUserAccessibleProjects(parseInt(auth.user.id));

    if (userProjects.length === 0) {
      return c.json({ jobs: [] });
    }

    const projectIds = userProjects.map(p => p.id);

    // Get jobs for user's projects with related data
    const jobRows = await db.select()
      .from(generationJobs)
      .leftJoin(projects, eq(generationJobs.projectId, projects.id))
      .leftJoin(users, eq(generationJobs.requestedBy, users.id))
      .where(inArray(generationJobs.projectId, projectIds))
      .orderBy(desc(generationJobs.createdAt));

    const jobs = jobRows.map(row => ({
      ...row.generation_jobs,
      project: row.projects,
      requester: row.users
    }));

    return c.json({ jobs });

  } catch (error) {
    logger.error('List jobs error', { error });
    return c.json({ error: 'Failed to list jobs' }, 500);
  }
});

/**
 * DELETE /api/public/v1/graph/codegen/:jobId
 * Cancel a running code generation job
 */
codegenRoutes.delete('/:jobId', async (c) => {
  try {
    const auth = c.get('auth');
    const jobId = c.req.param('jobId');

    const codegenService = new CodegenService();

    // Verify user has access to this job
    const hasPermission = await GraphPermissions.canAccessJob(parseInt(auth.user.id), jobId);

    if (!hasPermission) {
      return c.json({ error: 'Job not found or access denied' }, 404);
    }

    // Update job status to cancelled
    await db.update(generationJobs)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(generationJobs.uuid, jobId));

    // Cleanup WebSocket subscription if active
    await codegenService.cleanupSubscription(jobId);

    return c.json({ message: 'Job cancelled successfully' });

  } catch (error) {
    logger.error('Cancel job error', { error });
    return c.json({ error: 'Failed to cancel job' }, 500);
  }
});

export default codegenRoutes;
