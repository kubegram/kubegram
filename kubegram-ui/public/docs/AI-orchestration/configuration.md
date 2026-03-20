# AI Provider Configuration

This page covers how to configure AI providers in Kubegram. For an overview of how providers are selected and routed at runtime, see [AI Orchestration Concepts](./concepts).

Providers can be configured using:
- Environment variables (local development)
- YAML configuration files (deployed environments)

Only enabled providers are used during execution.

---

## Global Defaults

```env
KUBEGRAM_AI_MAX_TOKENS=4000
KUBEGRAM_AI_TEMPERATURE=0.2
KUBEGRAM_AI_TIMEOUT=30000
```

---

## Provider Configuration

### Anthropic (Claude)

```env
KUBEGRAM_ANTHROPIC_API_KEY=
KUBEGRAM_CLAUDE_MODEL=claude-3-5-sonnet-20241022
KUBEGRAM_ANTHROPIC_MAX_TOKENS=4000
KUBEGRAM_ANTHROPIC_TEMPERATURE=0.1
```

**Deployed configuration:**

```yaml
ai_providers:
  anthropic:
    enabled: true
    api_key: ${ANTHROPIC_API_KEY}
    model: claude-4-6
    temperature: 0.1
    max_tokens: 4000
    timeout: 30000
```

---

### OpenAI (GPT)

```env
KUBEGRAM_OPENAI_API_KEY=
KUBEGRAM_OPENAI_MODEL=gpt-4o
```

**Deployed configuration:**

```yaml
ai_providers:
  openai:
    enabled: true
    api_key: ${OPENAI_API_KEY}
    model: gpt-4o
```

---

### Google Gemini

```env
KUBEGRAM_GOOGLE_API_KEY=
KUBEGRAM_GOOGLE_MODEL=gemini-1.5-pro
```

**Deployed configuration:**

```yaml
ai_providers:
  google:
    enabled: true
    api_key: ${GOOGLE_API_KEY}
    model: gemini-1.5-pro
```

---

### DeepSeek

```env
KUBEGRAM_DEEPSEEK_API_KEY=
KUBEGRAM_DEEPSEEK_MODEL=deepseek-coder
```

---

### Ollama (Local Models)

```env
OLLAMA_BASE_URL=http://localhost:11434
KUBEGRAM_OLLAMA_MODEL=llama3.1:8b
KUBEGRAM_ENABLE_LOCAL_MODELS=true
```

---

### OpenRouter

OpenRouter is an API aggregator giving access to 100+ models (Llama, Mistral, Cohere, GPT-4o, Claude, etc.) through a single API key. Model IDs use the format `provider/model-name`.

```env
OPENROUTER_API_KEY=sk-or-...
```

**Deployed configuration:**

```yaml
ai_providers:
  openrouter:
    enabled: true
    api_key: ${OPENROUTER_API_KEY}
    model: openai/gpt-4o-mini     # default; any openrouter.ai/models ID works
    temperature: 0.2
    max_tokens: 4000
    timeout: 30000
```

**Example model IDs:**
- `openai/gpt-4o` — GPT-4o via OpenRouter
- `anthropic/claude-3-5-haiku` — Claude Haiku via OpenRouter
- `meta-llama/llama-3.1-70b-instruct` — Llama 3.1 70B
- `mistralai/mistral-7b-instruct` — Mistral 7B

See the full list at [openrouter.ai/models](https://openrouter.ai/models).

---

## Provider Selection Strategy

```yaml
provider_selection:
  strategy: intelligent

  fallback_order:
    - anthropic
    - openai
    - deepseek
    - openrouter
    - ollama

  task_specialization:
    code_generation:
      primary: anthropic
      fallback: deepseek

    architecture_design:
      primary: anthropic
      fallback: openai

    cost_optimization:
      primary: deepseek
      fallback: ollama

    sensitive_data:
      primary: ollama
      fallback: anthropic
```

---

## Load Balancing and Failover

```yaml
load_balancing:
  strategy: round_robin

  health_checks:
    enabled: true
    interval: 60s
    unhealthy_threshold: 3

  failover:
    automatic: true
    retry_different_provider: true
    max_retries: 3
    backoff_strategy: exponential
```

---

## See Also

- [AI Orchestration Concepts](./concepts) — how task routing, fallback, and privacy boundaries work
- [MCP & IDE Integration](../integrations/mcp-integration) — use AI-powered tools from your editor
