<!-- order: 1 -->

# What is Kubegram?

## Overview

**Kubegram** is an open-source Platform-as-a-Service (PaaS) that turns canvas-based architecture designs into production-ready Kubernetes clusters.

It automates the path from design to deployment by generating Kubernetes manifests, integrating with GitOps workflows, and continuously maintaining reliability through LLM-driven analysis for monitoring, failure detection, and intelligent autoscaling.

Kubegram runs locally or in shared environments and integrates with IDEs and AI assistants to support fast, iterative development.

---

## Core Concepts

### Architecture-First Kubernetes

Kubegram starts with architecture, not YAML.

You define systems using abstract models — via a visual canvas, IDE integration, or AI-assisted workflows — which are then translated into Kubernetes and infrastructure configurations. This removes the manual step of converting diagrams into low-level manifests.

---

### Local and Remote Execution

Kubegram operates in multiple environments:

- **Local execution** for development, experimentation, and validation
- **Shared or managed execution** for team-wide or production workflows

Running Kubegram locally enables rapid iteration, offline validation, and early feedback before changes are committed or deployed.

---

### GitOps-Native Workflow

Kubegram integrates directly with GitOps workflows and continuously reconciles desired state using Argo CD and Flux CD.

You can:

- Bring existing Git repositories and pipelines
- Let Kubegram generate and manage GitOps configuration
- Use Git as the source of truth for architecture and deployment

---

### Reliability and Runtime Intelligence

Kubegram continuously observes cluster behavior and application performance using LLM-driven analysis, enabling:

- Detection of outages and anomalous behavior
- Automated scaling of workloads based on demand
- Reduced operational overhead and faster response to incidents

---

### Progressive Delivery

Kubegram supports modern Kubernetes deployment strategies integrated directly into the GitOps lifecycle:

- Rolling deployments
- Canary rollouts
- A/B deployments

---

### IDE and AI Assistant Integration

Kubegram integrates with popular IDEs and AI assistants, bringing architecture design, validation, and refinement into the developer workflow:

- In-editor feedback and validation
- AI-assisted generation and explanation of configurations
- Faster iteration without context switching

---

## Typical Workflow

1. Define system architecture using a canvas, IDE, or AI assistant
2. Generate Kubernetes manifests and infrastructure configuration
3. Run and validate locally, or commit changes to a Git repository
4. Deploy and reconcile using GitOps tooling
5. Continuously monitor, scale, and adapt at runtime

---

## Intended Audience

Kubegram is built for:

- Platform engineering teams
- DevOps and SRE teams
- Developers working locally with Kubernetes
- Organizations adopting GitOps and progressive delivery

---

## Open Source and Extensibility

Kubegram is open source to encourage transparency, customization, and community contribution.

The open architecture lets teams:

- Understand how architecture models translate into Kubernetes resources
- Extend generation logic and workflows
- Integrate additional tools or AI assistants
- Run Kubegram entirely within local or private infrastructure

---

## Next Steps

- [Local Development Setup](./setup) — install and run Kubegram on your machine
- [Architecture](./architecture) — understand how Kubegram's components fit together
- [Visual Designer](../visual-designer/canvas-guide) — start designing infrastructure on the canvas
- [MCP & IDE Integration](../integrations/mcp-integration) — connect Kubegram to your editor or AI assistant
