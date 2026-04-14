/**
 * graph-mapper
 *
 * Maps the server's cleaned GraphInput (from @kubegram/common-ts via rag-client)
 * to kubegram-core's Graph type so it can be passed to runCodegenWorkflow().
 *
 * Both types originate from the same kuberag schema and are structurally
 * identical; the only practical difference is that GraphInput.graphType is
 * optional while Graph.graphType is required.
 */

import type { Graph } from '@kubegram/kubegram-core';
import { GraphType } from '@kubegram/kubegram-core';

/**
 * Convert a (cleaned) server graph input object into the kubegram-core Graph
 * type required by CodegenWorkflow.run().
 *
 * @param input  - Cleaned graph object from cleanGraphInput()
 * @param idOverride - If provided, used as the graph's ID (e.g. the jobId)
 *                     so that graph ID === job UUID throughout the system.
 */
export function mapToWorkflowGraph(
  input: {
    id?: string;
    name: string;
    description?: string;
    graphType?: string;
    userId: string;
    companyId: string;
    nodes?: unknown[];
    [key: string]: unknown;
  },
  idOverride?: string,
): Graph {
  return {
    id: idOverride ?? input.id ?? crypto.randomUUID(),
    name: input.name,
    description: input.description,
    graphType: ((input.graphType ?? 'KUBERNETES') as string).toUpperCase() as unknown as GraphType,
    userId: input.userId,
    companyId: input.companyId,
    nodes: (input.nodes ?? []) as Graph['nodes'],
  };
}
