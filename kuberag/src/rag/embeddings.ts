/**
 * Embeddings service with Voyage AI REST + local fallback
 * Port of app/rag/kubernetes_rag.py embedding functionality
 */

import { embeddingsConfig } from '../config';

// Voyage AI API response interface
interface VoyageAIResponse {
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// Embedding provider interface
export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
  getModelName(): string;
}

/**
 * Voyage AI embeddings provider (REST API)
 * Uses voyage-code-2 model for code embeddings
 */
export class VoyageAIProvider implements EmbeddingProvider {
  private readonly model: string = 'voyage-code-2';

  constructor(private readonly apiKey: string, private readonly baseURL: string) {
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          input: texts,
          input_type: 'document',
        }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Voyage AI API error: HTTP ${response.status} - ${errorText}`);
      }

      const result: VoyageAIResponse = await response.json();

      // Extract embeddings from response
      const embeddings = result.data.map(item => item.embedding);

      if (embeddings.length !== texts.length) {
        throw new Error(`Embedding count mismatch: expected ${texts.length}, got ${embeddings.length}`);
      }

      return embeddings;
    } catch (error) {
      console.error('Voyage AI embedding failed:', error);
      throw error;
    }
  }

  getDimensions(): number {
    return 1536; // voyage-code-2 produces 1536-dimensional embeddings
  }

  getModelName(): string {
    return this.model;
  }
}

/**
 * Local embeddings provider using @xenova/transformers
 * Uses all-MiniLM-L6-v2 model for local development
 */
export class LocalEmbeddingsProvider implements EmbeddingProvider {
  private readonly modelName: string = 'all-MiniLM-L6-v2';
  private pipeline: any = null;

  constructor() {
    this.initializePipeline();
  }

  private async initializePipeline(): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues
      const { pipeline } = await import('@xenova/transformers');

      console.info('Initializing local embeddings pipeline...');
      this.pipeline = await pipeline('feature-extraction', this.modelName);
      console.info('Local embeddings pipeline initialized');
    } catch (error) {
      console.error('Failed to initialize local embeddings pipeline:', error);
      throw new Error('Local embeddings not available. Install @xenova/transformers or use Voyage AI.');
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    if (!this.pipeline) {
      await this.initializePipeline();
    }

    try {
      // Generate embeddings
      const result = await this.pipeline(texts, { pooling: 'mean', normalize: true });

      // Convert to array format
      const embeddings = Array.isArray(result.data)
        ? result.data
        : [result.data];

      return embeddings.map((embedding: any) =>
        Array.isArray(embedding) ? embedding : Array.from(embedding)
      );
    } catch (error) {
      console.error('Local embedding failed:', error);
      throw error;
    }
  }

  getDimensions(): number {
    return 384; // all-MiniLM-L6-v2 produces 384-dimensional embeddings
  }

  getModelName(): string {
    return this.modelName;
  }
}

/**
 * Embeddings service with automatic fallback
 * Tries Voyage AI first, falls back to local embeddings
 */
export class EmbeddingsService {
  private voyageProvider: VoyageAIProvider | null = null;
  private localProvider: LocalEmbeddingsProvider | null = null;
  private preferredProvider: EmbeddingProvider | null = null;

  constructor() {
    this.initializeProviders();
  }

  private async initializeProviders(): Promise<void> {
    // Initialize Voyage AI provider if API key is available
    try {
      this.voyageProvider = new VoyageAIProvider(embeddingsConfig.voyage.apiKey, embeddingsConfig.voyage.baseURL);
      this.preferredProvider = this.voyageProvider;
      console.info('Voyage AI embeddings provider initialized');
    } catch (error) {
      console.warn('Failed to initialize Voyage AI provider:', error);
    }

    // Initialize local provider as fallback
    try {
      this.localProvider = new LocalEmbeddingsProvider();
      if (!this.preferredProvider) {
        this.preferredProvider = this.localProvider;
        console.info('Local embeddings provider initialized as primary');
      } else {
        console.info('Local embeddings provider initialized as fallback');
      }
    } catch (error) {
      console.warn('Failed to initialize local embeddings provider:', error);
    }

    if (!this.preferredProvider) {
      throw new Error('No embeddings providers available. Check VOYAGE_API_KEY or install @xenova/transformers.');
    }
  }

  /**
   * Generate embeddings for texts
   * @param texts - Array of texts to embed
   * @param useLocal - Force use of local provider
   */
  async embed(texts: string[], useLocal: boolean = false): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    let provider: EmbeddingProvider;

    if (useLocal) {
      if (!this.localProvider) {
        throw new Error('Local embeddings provider not available');
      }
      provider = this.localProvider;
    } else {
      // Try preferred provider first
      try {
        provider = this.preferredProvider!;
        const embeddings = await provider.embed(texts);
        console.debug(`Generated ${embeddings.length} embeddings using ${provider.getModelName()}`);
        return embeddings;
      } catch (error) {
        console.warn('Preferred provider failed, trying fallback:', error);

        // Fallback to local if preferred failed and it's not local
        if (this.preferredProvider !== this.localProvider && this.localProvider) {
          provider = this.localProvider;
        } else {
          throw error;
        }
      }
    }

    return await provider.embed(texts);
  }

  /**
   * Generate embedding for a single text
   */
  async embedSingle(text: string, useLocal: boolean = false): Promise<number[]> {
    const embeddings = await this.embed([text], useLocal);
    return embeddings[0] || [];
  }

  /**
   * Get current provider information
   */
  getProviderInfo(): {
    preferred: string;
    available: string[];
    dimensions: number;
  } {
    const available: string[] = [];

    if (this.voyageProvider) {
      available.push(`Voyage AI (${this.voyageProvider.getModelName()})`);
    }

    if (this.localProvider) {
      available.push(`Local (${this.localProvider.getModelName()})`);
    }

    return {
      preferred: this.preferredProvider?.getModelName() || 'none',
      available,
      dimensions: this.preferredProvider?.getDimensions() || 0,
    };
  }

  /**
   * Test embedding service
   */
  async test(): Promise<boolean> {
    try {
      const testText = "Hello, world!";
      const embedding = await this.embedSingle(testText);

      if (!embedding || embedding.length === 0) {
        console.error('Test embedding failed: empty result');
        return false;
      }

      const info = this.getProviderInfo();
      console.info(`Embedding test successful: ${embedding.length} dimensions using ${info.preferred}`);
      return true;
    } catch (error) {
      console.error('Embedding test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const embeddingsService = new EmbeddingsService();

// Export convenience functions
export async function generateEmbeddings(texts: string[], useLocal: boolean = false): Promise<number[][]> {
  return await embeddingsService.embed(texts, useLocal);
}

export async function generateEmbedding(text: string, useLocal: boolean = false): Promise<number[]> {
  return await embeddingsService.embedSingle(text, useLocal);
}

export function getEmbeddingProviderInfo() {
  return embeddingsService.getProviderInfo();
}