/**
 * Code generation service for kubegram-core
 * Adapted from kuberag to use dependency injection and @kubegram/events
 */

import { v4 as uuidv4 } from "uuid";
import { EventBus } from "@kubegram/events";
import { Graph } from "../types/graph.js";
import { GeneratedCodeGraph, JobStatus } from "../types/codegen.js";
import { ModelProvider, ModelName, JobStatusStatus } from "../types/enums.js";

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

export interface JobSubmissionOptions {
  modelProvider?: ModelProvider;
  modelName?: ModelName;
  priority?: "low" | "normal" | "high";
  timeout?: number;
  enableCache?: boolean;
  enableRAG?: boolean;
}

export interface BackgroundJobContext {
  threadId: string;
  jobId: string;
  graph: Graph;
  options: JobSubmissionOptions;
  startTime: number;
  userContext?: string[];
}

export interface CodegenServiceConfig {
  dgraphClient?: unknown;
  redisClient?: unknown;
}

/**
 * High-level façade for code generation jobs.
 *
 * This service is a thin orchestration layer — it generates a jobId, publishes
 * a `codegen.started` DomainEvent, and returns immediately. The actual workflow
 * execution (CodegenWorkflow) must be triggered by the caller (typically kuberag)
 * after receiving that event. Methods like `generateCode` and `getGeneratedCode`
 * are intentional no-ops or stubs until that wiring is complete.
 *
 * Injection points:
 *  - `eventBus`: @kubegram/events EventBus instance.
 *  - `config.redisClient`: ioredis client (reserved; not yet used).
 */
export class CodegenService {
  private eventBus: EventBus;
  private config: CodegenServiceConfig;
  private readonly activeJobs = new Map<string, BackgroundJobContext>();
  private readonly jobResults = new Map<string, GeneratedCodeGraph>();

  constructor(eventBus: EventBus, config: CodegenServiceConfig = {}) {
    this.eventBus = eventBus;
    this.config = config;
  }

  async initializeCodegen(
    graph: Graph,
    options: JobSubmissionOptions = {},
  ): Promise<{ jobId: string }> {
    const jobId = uuidv4();

    await this.eventBus.publish({
      id: uuidv4(),
      type: "codegen.started",
      occurredOn: new Date(),
      aggregateId: jobId,
      metadata: {
        jobId,
        graphId: graph.id,
        graphName: graph.name,
        companyId: graph.companyId,
        userId: graph.userId,
        options,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    return { jobId };
  }

  async getJobStatus(_jobId: string): Promise<JobStatus | null> {
    return {
      jobId: _jobId,
      status: JobStatusStatus.PENDING,
      step: "pending",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async cancelJob(_jobId: string): Promise<boolean> {
    return false;
  }

  async generateCode(
    graph: Graph,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: JobSubmissionOptions = {},
  ): Promise<GeneratedCodeGraph> {
    throw new Error(
      "Not implemented - use initializeCodegen for async job submission",
    );
  }

  async submitJob(
    graph: Graph,
    options: JobSubmissionOptions = {},
  ): Promise<JobStatus> {
    const jobId = uuidv4();

    await this.eventBus.publish({
      id: uuidv4(),
      type: "codegen.started",
      occurredOn: new Date(),
      aggregateId: jobId,
      metadata: {
        jobId,
        graphId: graph.id,
        graphName: graph.name,
        companyId: graph.companyId,
        userId: graph.userId,
        options,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    return {
      jobId,
      status: JobStatusStatus.PENDING,
      step: "queued",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getGeneratedCode(_jobId: string): Promise<GeneratedCodeGraph | null> {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkCache(_graph: Graph): Promise<GeneratedCodeGraph | null> {
    return null;
  }

  async listActiveJobs(): Promise<JobStatus[]> {
    return [];
  }

  private async submitBackgroundJob(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: BackgroundJobContext,
  ): Promise<void> {
    // Background job processing would be implemented here
  }

  private startJobProcessor(): void {
    // Background processor would be started here
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async cancelCodegenWorkflow(_threadId: string): Promise<boolean> {
    return false;
  }
}
