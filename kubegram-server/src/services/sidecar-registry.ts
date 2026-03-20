/**
 * SidecarRegistry — in-memory store of kubegram-sidecar pod endpoints.
 *
 * Populated by the sidecar reporter's periodic pushes to
 * POST /api/public/v1/metrics/traffic (which now includes podIP).
 *
 * Used by the validation workflow's DISCOVER_SIDECARS step via
 * GET /api/internal/sidecars?namespace=X to find sidecar pod IPs
 * for a given namespace before fanning out test cases.
 *
 * Entries expire after TTL_MS (default: 5 minutes) to evict stale pods
 * (e.g. after a pod restart). The sidecar reporter runs every 15s so
 * live pods refresh well within the TTL.
 */

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface SidecarEntry {
  namespace: string;
  pod: string;
  podIP: string;
  service: string;
  validatePort: number;
  lastSeen: number; // epoch ms
}

class SidecarRegistry {
  private readonly entries = new Map<string, SidecarEntry>();

  private key(namespace: string, pod: string): string {
    return `${namespace}/${pod}`;
  }

  /**
   * Upsert a sidecar entry. Called when a traffic report arrives.
   */
  register(namespace: string, pod: string, podIP: string, service: string): void {
    const k = this.key(namespace, pod);
    this.entries.set(k, {
      namespace,
      pod,
      podIP,
      service,
      validatePort: 9090,
      lastSeen: Date.now(),
    });
  }

  /**
   * Returns all live sidecar entries for a given namespace.
   * Entries older than TTL_MS are evicted.
   */
  listByNamespace(namespace: string): SidecarEntry[] {
    const now = Date.now();
    const result: SidecarEntry[] = [];

    for (const [k, entry] of this.entries) {
      if (now - entry.lastSeen > TTL_MS) {
        this.entries.delete(k);
        continue;
      }
      if (entry.namespace === namespace) {
        result.push(entry);
      }
    }

    return result;
  }
}

// Singleton — shared across all requests in the same process.
export const sidecarRegistry = new SidecarRegistry();
