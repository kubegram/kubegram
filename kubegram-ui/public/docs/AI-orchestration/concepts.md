# AI Orchestration Concepts

Kubegram includes an AI orchestration layer that supports multiple LLM providers. Infrastructure and platform tasks are routed to the most appropriate model based on capability, cost, performance, and privacy requirements.

Providers can be combined, prioritized, load-balanced, or used as fallbacks. Kubegram supports hosted, open-source, and fully local models.

---

## Why Multi-Provider AI?

Different models excel at different tasks. Kubegram treats AI providers as interchangeable execution engines behind a unified interface, which enables:

- No vendor lock-in
- Task-specific model selection
- Cost-aware routing
- Privacy-first execution for sensitive workloads
- High availability through automatic provider failover

---

## Provider Types

### Hosted Providers

Cloud-hosted models accessed via API. Best for reasoning-heavy and large-scale tasks.

Examples:
- Anthropic (Claude)
- OpenAI (GPT)
- Google Gemini
- DeepSeek

---

### Local Providers

Self-hosted models running entirely on your own infrastructure.

Examples:
- Ollama-backed models (Llama, Mistral, Code Llama)

Local providers are well-suited for:
- Sensitive or regulated data
- Offline or air-gapped environments
- Full control over execution and data residency

---

## Task-Based Model Selection

Kubegram classifies AI workloads by intent, not by provider. Common task categories include:

- Architecture analysis
- Kubernetes manifest generation
- Code review and refactoring
- Cost optimization
- Predictive autoscaling
- Validation and explanation

Each task type can be mapped to a preferred provider with defined fallbacks.

---

## High-Level Execution Flow

1. A task is submitted (e.g. generate Kubernetes manifests)
2. The task type is identified
3. Provider selection strategy is applied
4. The request is routed to the selected model
5. Results are validated and merged if needed
6. Automatic failover occurs on errors

---

## Privacy and Compliance Model

Kubegram enforces provider-level data boundaries:

- Sensitive tasks can be restricted to local models only
- Hosted providers are used only when permitted by policy
- Audit logs track provider usage without storing responses

This lets teams comply with strict security and regulatory requirements without giving up AI automation.

---

## Next Steps

- [AI Provider Configuration](./configuration) — set up API keys, model selection, and fallback strategies
- [MCP & IDE Integration](../integrations/mcp-integration) — use AI-powered tools directly from your editor
