/**
 * @stub EntityService — Dgraph entity persistence stays in kuberag.
 *
 * All Dgraph reads and writes for graph nodes are performed by kuberag's
 * EntityService. kuberag calls kubegram-core's workflow layer after resolving
 * DB state, passing the pre-fetched graph via CodegenWorkflowOptions.existingDbGraph.
 *
 * This file exports only the `EntityServiceConfig` interface for type
 * compatibility. Do not add Dgraph client code here — kubegram-core must remain
 * portable (no Dgraph dependency).
 */

export interface EntityServiceConfig {
  dgraphClient?: unknown;
}
