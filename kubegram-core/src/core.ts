import { EventBus } from '@kubegram/common-events';

/**
 * KubegramCore — top-level composition root for the kubegram-core library.
 *
 * Instantiate once per process and pass the resulting `eventBus` into any
 * workflow or service that needs pub/sub. This class intentionally does very
 * little: all real configuration (Redis clients, LLM API keys, RAG services)
 * is passed directly to concrete workflow constructors so that the library
 * stays portable and testable.
 *
 * @example
 * const core = new KubegramCore();
 * const workflow = new CodegenWorkflow(redisClient, core.eventBus);
 */
export class KubegramCore {
  eventBus: EventBus;

  constructor() {
    this.eventBus = new EventBus({ enableCache: true });
  }

  // Lifecycle hooks reserved for future use (e.g. warming up connection pools).
  // They are no-ops today — all initialization happens in concrete workflows.
  async initialize() {}
  async shutdown() {}
}
