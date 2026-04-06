/**
 * Maps kubegram-core ModelProvider enum values to named BAML client definitions.
 * Used to select the correct LLM client at runtime when calling BAML functions.
 */

import { ClientRegistry } from '@boundaryml/baml';
import { ModelProvider } from '../types/enums.js';

// Maps each ModelProvider to the BAML client name defined in baml_src/clients.baml.
// Gemma (Ollama) and OpenRouter do not have dedicated BAML clients yet;
// they fall back to ClaudeClient and OpenAIClient respectively.
const PROVIDER_TO_BAML_CLIENT: Record<ModelProvider, string> = {
  [ModelProvider.claude]:      'ClaudeClient',
  [ModelProvider.openai]:      'OpenAIClient',
  [ModelProvider.google]:      'GeminiClient',
  [ModelProvider.deepseek]:    'DeepSeekClient',
  [ModelProvider.gemma]:       'ClaudeClient',    // Ollama not yet in BAML clients
  [ModelProvider.openrouter]:  'OpenAIClient',    // same OpenAI wire format
};

/**
 * Builds a BAML ClientRegistry that sets the primary client for a given
 * ModelProvider. Pass the result as `{ clientRegistry }` in BamlCallOptions.
 */
export function buildClientRegistry(provider: ModelProvider): ClientRegistry {
  const registry = new ClientRegistry();
  const clientName = PROVIDER_TO_BAML_CLIENT[provider] ?? 'KubegramFallback';
  registry.setPrimary(clientName);
  return registry;
}
