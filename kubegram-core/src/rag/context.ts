/**
 * @stub RAG context builder — not implemented in kubegram-core.
 *
 * The concrete implementation lives in kuberag, which requires Dgraph vector
 * search for finding similar graphs. This class is exported for type compatibility
 * only — its methods return empty results.
 *
 * To inject RAG context into CodegenWorkflow, implement the RAGContextService
 * interface defined in workflows/codegen-workflow.ts and pass it as an option:
 *
 *   new CodegenWorkflow(redis, eventBus, { ragContextService: myRagImpl });
 *
 * kubegram-core degrades gracefully when no ragContextService is provided
 * (proceeds with empty RAG context).
 */

export interface RagContextOptions {
  includeSimilar?: boolean;
  maxResults?: number;
}

export class RagContextService {
  async buildContext(
    _graphId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: RagContextOptions = {},
  ): Promise<string> {
    return "";
  }

  async findSimilar(
    _embedding: number[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _limit: number = 5,
  ): Promise<unknown[]> {
    return [];
  }
}

export const ragContextService = new RagContextService();
