/**
 * WorkflowService
 *
 * Owns the EventCache and EventBus instances shared across all in-process
 * kubegram-core workflow executions. Wraps runCodegenWorkflow() so that:
 *   - The workflow runs in the background (fire-and-forget).
 *   - The generation_jobs DB row is updated to 'completed'/'failed' when done.
 *   - Status can be polled via getStatus() while the workflow is running.
 *   - The workflow can be cancelled via cancel().
 */

import {
  EventCache,
  EventBus,
  LocalPubSubProvider,
  RedisEventStorage,
  StorageMode,
} from '@kubegram/events';
import {
  runCodegenWorkflow,
  getCodegenWorkflowStatus,
  cancelCodegenWorkflow,
  runPlanWorkflow,
  getPlanWorkflowStatus,
  cancelPlanWorkflow,
  type Graph,
  type WorkflowContext,
  type CodegenWorkflowOptions,
  type PlanWorkflowOptions,
  type PlanWorkflowResult,
} from '@kubegram/kubegram-core';
import { redisClient } from '@/state/redis';
import { db } from '@/db';
import { generationJobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import logger from '@/utils/logger';

export class WorkflowService {
  private static instance: WorkflowService | null = null;

  private eventCache!: EventCache;
  private eventBus!: EventBus;
  private initialized = false;

  // Plan job tracking (in-process fallback path)
  private readonly localPlanJobs = new Set<string>();
  private readonly planJobResults = new Map<string, PlanWorkflowResult>();
  private readonly planJobErrors = new Map<string, string>();

  private constructor() {}

  static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService();
    }
    return WorkflowService.instance;
  }

  /**
   * Must be called before any other method.
   * Safe to call multiple times — initializes only once.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const redis = redisClient.getClient();

    // RedisEventStorage expects a redis v4-style client interface.
    // ioredis is runtime-compatible; the only difference is expire() returning
    // number (1|0) instead of boolean — we adapt that here.
    const redisAdapter = Object.assign(Object.create(Object.getPrototypeOf(redis)), redis, {
      expire: async (key: string, seconds: number): Promise<boolean> => {
        const result = await redis.expire(key, seconds);
        return result === 1;
      },
    });

    const storage = new RedisEventStorage({
      redis: redisAdapter as any,
      keyPrefix: 'kubegram:workflow:',
      eventTTL: 86400, // 24 h
    });

    this.eventCache = new EventCache({ storage, mode: StorageMode.WRITE_THROUGH });
    this.eventBus = new EventBus({
      provider: new LocalPubSubProvider(),
      enableCache: false,
    });

    this.initialized = true;
    logger.info('WorkflowService initialized');
  }

  /**
   * Starts a codegen workflow in the background.
   * Returns immediately; updates the generation_jobs row when done.
   */
  async startCodegen(
    graph: Graph,
    jobId: string,
    context: WorkflowContext,
    options?: CodegenWorkflowOptions,
  ): Promise<void> {
    const promise = runCodegenWorkflow(
      graph,
      jobId,
      context,
      this.eventCache,
      this.eventBus,
      options,
    );

    promise
      .then(async (result) => {
        try {
          if (result.success && result.generatedCode) {
            await db!
              .update(generationJobs)
              .set({
                status: 'completed',
                resultData: JSON.stringify(result.generatedCode),
                progress: 100,
                completedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(generationJobs.uuid, jobId));
            logger.info('Codegen workflow completed', { jobId });
          } else {
            await db!
              .update(generationJobs)
              .set({
                status: 'failed',
                errorMessage: result.error ?? 'Workflow failed without an error message',
                completedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(generationJobs.uuid, jobId));
            logger.warn('Codegen workflow failed', { jobId, error: result.error });
          }
        } catch (dbErr) {
          logger.error('Failed to update job record after workflow completion', {
            jobId,
            error: dbErr instanceof Error ? dbErr.message : String(dbErr),
          });
        }
      })
      .catch(async (error) => {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('Unhandled codegen workflow error', { jobId, error: message });
        try {
          await db!
            .update(generationJobs)
            .set({
              status: 'failed',
              errorMessage: message,
              completedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(generationJobs.uuid, jobId));
        } catch (dbErr) {
          logger.error('Failed to update job record after workflow error', {
            jobId,
            error: dbErr instanceof Error ? dbErr.message : String(dbErr),
          });
        }
      });
  }

  /**
   * Returns the current workflow state from the EventCache, or null if the
   * workflow state has expired or was never started.
   */
  async getStatus(threadId: string) {
    return getCodegenWorkflowStatus(threadId, this.eventCache, this.eventBus);
  }

  /**
   * Signals the running workflow to stop.
   * Returns true if the cancellation was registered successfully.
   */
  async cancel(threadId: string): Promise<boolean> {
    return cancelCodegenWorkflow(threadId, this.eventCache, this.eventBus);
  }

  // ---------------------------------------------------------------------------
  // Plan workflow (in-process fallback when KubeRAG is unreachable)
  // ---------------------------------------------------------------------------

  isLocalJob(jobId: string): boolean {
    return this.localPlanJobs.has(jobId);
  }

  /**
   * Starts a plan workflow in the background.
   * Returns immediately; result is stored in planJobResults on completion.
   */
  startPlan(
    userRequest: string,
    graph: Graph,
    jobId: string,
    context: WorkflowContext,
    options: PlanWorkflowOptions,
  ): void {
    this.localPlanJobs.add(jobId);

    const promise = runPlanWorkflow(
      userRequest,
      jobId,
      context,
      this.eventCache,
      this.eventBus,
      options,
    );

    promise
      .then((result) => {
        this.planJobResults.set(jobId, result);
        if (result.success) {
          logger.info('Plan workflow completed', { jobId });
        } else {
          this.planJobErrors.set(jobId, result.error ?? 'Plan workflow failed');
          logger.warn('Plan workflow failed', { jobId, error: result.error });
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.planJobErrors.set(jobId, message);
        logger.error('Unhandled plan workflow error', { jobId, error: message });
      });
  }

  async getPlanStatus(threadId: string): Promise<{ jobId: string; status: string; step: string; error?: string }> {
    if (this.planJobErrors.has(threadId)) {
      return { jobId: threadId, status: 'failed', step: 'completed', error: this.planJobErrors.get(threadId) };
    }
    if (this.planJobResults.has(threadId)) {
      return { jobId: threadId, status: 'completed', step: 'completed' };
    }
    const state = await getPlanWorkflowStatus(threadId, this.eventCache, this.eventBus);
    if (state) {
      return { jobId: threadId, status: state.status, step: state.currentStep };
    }
    return { jobId: threadId, status: 'pending', step: 'queued' };
  }

  async getPlanResults(threadId: string): Promise<PlanWorkflowResult | null> {
    return this.planJobResults.get(threadId) ?? null;
  }

  async cancelPlan(threadId: string): Promise<boolean> {
    return cancelPlanWorkflow(threadId, this.eventCache, this.eventBus);
  }
}

export const workflowService = WorkflowService.getInstance();
