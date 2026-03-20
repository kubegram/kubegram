# High Availability Deployment

Kubegram supports a High Availability (HA) deployment mode that can be installed onto **any Kubernetes cluster using the Kubegram CLI**.

HA mode is recommended for production environments where uptime, fault tolerance, and operational continuity are required.

---

## Control Plane High Availability

In HA mode, the Kubegram control plane is deployed as a set of replicated, stateless services.

Key characteristics:

- Multiple replicas of all control-plane components
- Optional persistent state (database, object storage, or KV store)
- Safe horizontal scaling

The Kubegram CLI handles:
- Initial HA installation
- Cluster bootstrapping
- Idempotent upgrades

---

## Scheduling and Fault Tolerance

To ensure resilience:

- Control-plane pods should be spread across nodes or zones
- Pod Disruption Budgets (PDBs) should be configured
- Readiness and liveness probes must be enabled

Recommended minimums:
- 2 replicas for non-critical environments
- 3+ replicas for production environments

---

## Operator High Availability

Kubegram operators are deployed per target cluster and support HA by design.

- Operators run with leader election enabled
- Multiple replicas can safely run concurrently
- Operator failure does not affect existing workloads

Operators can be upgraded or restarted without downtime.

---

## CLI-Based Installation

HA deployments are managed exclusively through the Kubegram CLI.

Example:
```bash
kubegram install \
  --mode ha \
  --namespace kubegram-system
```

---

## See Also

- [Deployment Guide](./deployment) — deployment topologies and the control-plane / workload-cluster model
