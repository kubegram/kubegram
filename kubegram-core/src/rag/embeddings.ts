/**
 * @stub RAG embeddings service — not implemented in kubegram-core.
 *
 * The concrete implementation lives in kuberag, which has a direct Voyage AI
 * dependency. This stub exists so that consumers can import the type interface
 * without coupling to kuberag.
 *
 * To use embeddings, subclass EmbeddingsService and override `generateEmbedding()`
 * with an implementation that calls the Voyage AI REST API (or any other provider).
 * Alternatively, use kuberag's concrete implementation directly.
 */

export interface EmbeddingsConfig {
  voyageApiKey?: string;
}

export class EmbeddingsService {
  private config: EmbeddingsConfig;

  constructor(config: EmbeddingsConfig = {}) {
    this.config = config;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async generateEmbedding(_text: string): Promise<number[]> {
    // Subclass EmbeddingsService and override this method, or use kuberag's
    // concrete implementation which wraps the Voyage AI REST API.
    throw new Error("Not implemented - requires API key configuration");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async generateEmbeddings(_texts: string[]): Promise<number[][]> {
    // Subclass EmbeddingsService and override this method, or use kuberag's
    // concrete implementation which wraps the Voyage AI REST API.
    throw new Error("Not implemented - requires API key configuration");
  }
}

export const embeddingsService = new EmbeddingsService();
