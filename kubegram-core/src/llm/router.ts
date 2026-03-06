/**
 * LLM Router — intelligent routing, failover, and rate limiting across providers.
 *
 * Usage:
 *   const router = createLLMRouter({
 *     providers: [
 *       { provider: ModelProvider.claude, modelName: 'claude-sonnet-4-6', priority: 1 },
 *       { provider: ModelProvider.openai, modelName: 'gpt-4o', priority: 2 },
 *     ],
 *     taskRouting: { codegen: ModelProvider.claude, suggest: ModelProvider.openai },
 *   });
 *
 *   // In a workflow:
 *   const { text } = await router.generateText({ system, prompt, temperature: 0 }, 'codegen');
 */

import { generateText } from 'ai';
import type { GenerateTextResult } from 'ai';
import { ModelProvider, ModelName } from '../types/enums.js';
import { createLLMProvider, type LanguageModel } from './providers.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ProviderEntry {
  provider: ModelProvider;
  modelName?: ModelName | string;
  /** Lower number = higher priority. 1 is tried first. */
  priority: number;
  /** Tasks this provider is preferred for (informational; used by taskAffinity selection). */
  taskAffinity?: string[];
  /** If set, skip this provider when it has handled this many requests in the current minute. */
  maxRequestsPerMin?: number;
}

export interface LLMRouterConfig {
  providers: ProviderEntry[];
  /** Explicit task → preferred provider mapping. Overrides priority ordering for that task. */
  taskRouting?: Record<string, ModelProvider>;
}

export interface ProviderHealthState {
  provider: ModelProvider;
  isHealthy: boolean;
  consecutiveFailures: number;
  lastFailureAt?: Date;
  cooldownUntil?: Date;
}

/** All params accepted by the AI SDK's generateText, minus `model` (router selects that). */
export type RouterGenerateTextParams = Omit<Parameters<typeof generateText>[0], 'model'>;

// ---------------------------------------------------------------------------
// LLMRouter
// ---------------------------------------------------------------------------

export class LLMRouter {
  private healthState = new Map<ModelProvider, ProviderHealthState>();
  private requestCounts = new Map<ModelProvider, { count: number; resetAt: number }>();

  constructor(private config: LLMRouterConfig) {}

  /**
   * Select the best available provider for the given task and return its LanguageModel.
   * Throws if no healthy provider exists.
   */
  selectProvider(task?: string): LanguageModel {
    // 1. Task-specific routing takes precedence
    if (task && this.config.taskRouting?.[task]) {
      const preferred = this.config.taskRouting[task];
      const entry = this.config.providers.find(p => p.provider === preferred);
      if (entry && this.isProviderHealthy(entry.provider) && !this.isRateLimited(entry)) {
        return createLLMProvider(entry.provider, entry.modelName);
      }
    }

    // 2. Priority-ordered fallback
    const sorted = this.getSortedProviders();
    for (const entry of sorted) {
      if (this.isProviderHealthy(entry.provider) && !this.isRateLimited(entry)) {
        return createLLMProvider(entry.provider, entry.modelName);
      }
    }

    throw new Error('No healthy LLM providers available');
  }

  /**
   * Wraps the AI SDK's generateText with automatic failover across providers.
   * Tries providers in priority order (respecting taskRouting), tracking failures
   * and rate limits. Returns the first successful result.
   */
  async generateText(
    params: RouterGenerateTextParams,
    task?: string
  ): Promise<GenerateTextResult<Record<string, never>, string>> {
    const orderedEntries = this.getOrderedEntries(task);

    let lastError: unknown;

    for (const entry of orderedEntries) {
      if (!this.isProviderHealthy(entry.provider)) {
        console.warn(`[LLMRouter] Skipping ${entry.provider}: in cooldown`);
        continue;
      }
      if (this.isRateLimited(entry)) {
        console.warn(`[LLMRouter] Skipping ${entry.provider}: rate limited`);
        continue;
      }

      try {
        const model = createLLMProvider(entry.provider, entry.modelName);
        const result = await generateText({ ...params, model } as Parameters<typeof generateText>[0]);
        this.markSuccess(entry.provider);
        this.trackRequest(entry.provider);
        console.info(`[LLMRouter] ${entry.provider} succeeded${task ? ` (task: ${task})` : ''}`);
        return result as GenerateTextResult<Record<string, never>, string>;
      } catch (err) {
        console.warn(`[LLMRouter] ${entry.provider} failed, trying next provider`, err);
        this.markFailure(entry.provider);
        lastError = err;
      }
    }

    throw new Error(
      `All LLM providers failed${task ? ` for task "${task}"` : ''}. Last error: ${lastError}`
    );
  }

  /** Record a provider failure and set cooldown if consecutive failures exceed threshold. */
  markFailure(provider: ModelProvider): void {
    const state: ProviderHealthState = this.healthState.get(provider) ?? {
      provider,
      isHealthy: true,
      consecutiveFailures: 0,
    };

    state.consecutiveFailures += 1;
    state.lastFailureAt = new Date();

    // Exponential backoff: 1 min, 2 min, 4 min ... up to 1 hour
    if (state.consecutiveFailures >= 3) {
      const cooldownSeconds = Math.min(
        60 * Math.pow(2, state.consecutiveFailures - 3),
        3600
      );
      state.cooldownUntil = new Date(Date.now() + cooldownSeconds * 1000);
      state.isHealthy = false;
      console.warn(
        `[LLMRouter] ${provider} entering cooldown for ${cooldownSeconds}s ` +
        `(${state.consecutiveFailures} consecutive failures)`
      );
    }

    this.healthState.set(provider, state);
  }

  /** Reset health state for a provider on success. */
  markSuccess(provider: ModelProvider): void {
    this.healthState.delete(provider);
  }

  /** Serializable snapshot of all tracked provider health states. */
  getHealthState(): Record<string, ProviderHealthState> {
    return Object.fromEntries(this.healthState);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private isProviderHealthy(provider: ModelProvider): boolean {
    const state = this.healthState.get(provider);
    if (!state) return true;
    if (state.cooldownUntil && state.cooldownUntil > new Date()) return false;
    // Cooldown expired — allow retry (health resets on next success)
    if (state.cooldownUntil && state.cooldownUntil <= new Date()) {
      state.isHealthy = true;
      state.cooldownUntil = undefined;
    }
    return true;
  }

  private isRateLimited(entry: ProviderEntry): boolean {
    if (!entry.maxRequestsPerMin) return false;

    const now = Date.now();
    const record = this.requestCounts.get(entry.provider);

    if (!record || record.resetAt <= now) {
      return false; // window expired or never started
    }

    return record.count >= entry.maxRequestsPerMin;
  }

  private trackRequest(provider: ModelProvider): void {
    const now = Date.now();
    const record = this.requestCounts.get(provider);

    if (!record || record.resetAt <= now) {
      this.requestCounts.set(provider, { count: 1, resetAt: now + 60_000 });
    } else {
      record.count += 1;
    }
  }

  private getSortedProviders(): ProviderEntry[] {
    return [...this.config.providers].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Build an ordered list of entries to try for a given task.
   * The task-preferred provider goes first, followed by the rest in priority order.
   */
  private getOrderedEntries(task?: string): ProviderEntry[] {
    const sorted = this.getSortedProviders();

    if (task && this.config.taskRouting?.[task]) {
      const preferredProvider = this.config.taskRouting[task];
      const preferred = sorted.find(e => e.provider === preferredProvider);
      if (preferred) {
        return [preferred, ...sorted.filter(e => e.provider !== preferredProvider)];
      }
    }

    return sorted;
  }
}

// ---------------------------------------------------------------------------
// Convenience factory
// ---------------------------------------------------------------------------

export function createLLMRouter(config: LLMRouterConfig): LLMRouter {
  return new LLMRouter(config);
}
