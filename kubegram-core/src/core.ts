import { EventBus } from '@kubegram/events';

/**
 * Configuration options for KubegramCore
 */
export interface KubegramCoreConfig {
  /** Enable MCP WebSocket server (default: false) */
  enableMcp?: boolean;
  /** MCP WebSocket port (default: 3001) */
  mcpPort?: number;
  /** Enable event caching (default: true) */
  enableCache?: boolean;
}

/**
 * KubegramCore — top-level composition root for the kubegram-core library.
 *
 * Instantiate once per process and pass the resulting `eventBus` into any
 * workflow or service that needs pub/sub. This class intentionally does very
 * little: all real configuration (Redis clients, LLM API keys, RAG services)
 * is passed directly to concrete workflow constructors so that the library
 * stays portable and testable.
 *
 * Environment variables:
 *   - ENABLE_MCP: Enable MCP WebSocket server (default: false)
 *   - MCP_WS_PORT: MCP WebSocket port (default: 3001)
 *
 * @example
 * const core = new KubegramCore();
 * const workflow = new CodegenWorkflow(redisClient, core.eventBus);
 */
export class KubegramCore {
  eventBus: EventBus;
  config: Required<KubegramCoreConfig>;

  constructor(config: KubegramCoreConfig = {}) {
    this.config = {
      enableMcp: config.enableMcp ?? process.env.ENABLE_MCP === 'true',
      mcpPort: config.mcpPort ?? parseInt(process.env.MCP_WS_PORT ?? '3001', 10),
      enableCache: config.enableCache ?? true,
    };
    this.eventBus = new EventBus({ enableCache: this.config.enableCache });
  }

  // Lifecycle hooks reserved for future use (e.g. warming up connection pools).
  // They are no-ops today — all initialization happens in concrete workflows.
  async initialize() {
    if (this.config.enableMcp) {
      console.info(`MCP WebSocket server would start on port ${this.config.mcpPort}`);
      // MCP server initialization will be implemented here
    }
  }
  async shutdown() {}
}
