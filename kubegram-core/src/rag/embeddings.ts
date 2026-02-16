/**
 * RAG embeddings service
 * Copied from kuberag - requires configuration adaptation
 */

export interface EmbeddingsConfig {
  voyageApiKey?: string;
}

export class EmbeddingsService {
  private config: EmbeddingsConfig;

  constructor(config: EmbeddingsConfig = {}) {
    this.config = config;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    throw new Error('Not implemented - requires API key configuration');
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    throw new Error('Not implemented - requires API key configuration');
  }
}

export const embeddingsService = new EmbeddingsService();
