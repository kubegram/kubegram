# Deployment Guide

This guide covers the deployment topologies supported by Kubegram — from single-cluster setups to multi-cluster production environments — and explains the control-plane / workload-cluster separation model.

## Recommended Deployment

Kubegram open source itself can be deployed onto any container orchestrator that can deploy docker images or any Kubernetes Cluster. Only the Kubegram operators and sidecars should be deployed onto the target cluster(s).

### Control Plane vs Target Clusters

Kubegram follows a **control-plane / workload-cluster** model:
- **Kubegram Control Plane**
    - Runs Kubegram services (API, UI, AI orchestration, state)
    - Can be deployed:
        - On Kubernetes
        - On a container platform (ECS, Nomad, Docker Swarm)
        - Locally (for development or air-gapped environments)
            
- **Target Clusters**
    - Kubernetes clusters managed by Kubegram
    - Only Kubegram **operators** and **sidecars** are deployed here
    - No central Kubegram services run inside workload clusters
        

This separation improves:
- Security isolation
- Blast-radius containment
- Multi-cluster scalability

### Deployment Topologies
#### Single-Cluster Deployment

Best for:
- Small teams
- Internal platforms
- Early production usage

Characteristics:
- Control plane and operators run in the same Kubernetes cluster
- Simplified networking and authentication
- Lower operational overhead
#### Multi-Cluster Deployment (Recommended for Production)

Best for:
- Enterprises
- Multi-region setups
- Regulated environments

Characteristics:
- Dedicated control-plane cluster
- One or more workload clusters
- Operators installed per target cluster
- Centralized AI orchestration and policy enforcement

#### HA Deployment

Kubegram supports a High Availability (HA) deployment mode that can be installed onto **any Kubernetes cluster using the Kubegram CLI**.

HA mode is recommended for production environments where uptime, fault tolerance, and operational continuity are required.

---

## Next Steps

- [High Availability Deployment](./ha-deployment) — configure replicated control-plane components, PDBs, and leader-elected operators
- [Kubegram GitHub Application](./using-the-kubegram-application) — automate manifest delivery via Pull Request and Argo CD
