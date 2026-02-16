/**
 * RAG context builder
 * Copied from kuberag
 */

export interface RagContextOptions {
  includeSimilar?: boolean;
  maxResults?: number;
}

export class RagContextService {
  async buildContext(graphId: string, options: RagContextOptions = {}): Promise<string> {
    return '';
  }

  async findSimilar(embedding: number[], limit: number = 5): Promise<any[]> {
    return [];
  }
}

export const ragContextService = new RagContextService();
