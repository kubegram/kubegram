/**
 * LLM provider factory using Vercel AI SDK
 * Port of app/common/model_providers.py
 * Supports all 5 providers: Claude, OpenAI, Google Gemini, DeepSeek, Ollama/Gemma
 */

import { type LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { llmConfig, embeddingsConfig } from '../config';
import { ModelProvider, ModelName, VALID_MODELS, DEFAULT_MODEL } from '../types/enums';

// Type for language model instances — matches what generateText() expects
export type LanguageModel = LanguageModelV1;

// Provider configuration interface
export interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

/**
 * LLM provider factory class
 * Replaces Python LangChain models with Vercel AI SDK providers
 */
export class LLMProviderFactory {
  private static instances: Map<ModelProvider, any> = new Map();

  /**
   * Get or create a provider instance
   */
  static getProvider(provider: ModelProvider, config?: ProviderConfig): any {
    const cacheKey = provider;
    
    if (this.instances.has(cacheKey)) {
      return this.instances.get(cacheKey);
    }

    let instance: any;

    switch (provider) {
      case ModelProvider.claude:
        instance = this.createAnthropicProvider(config);
        break;
      
      case ModelProvider.openai:
        instance = this.createOpenAIProvider(config);
        break;
      
      case ModelProvider.google:
        instance = this.createGoogleProvider(config);
        break;
      
      case ModelProvider.deepseek:
        instance = this.createDeepSeekProvider(config);
        break;
      
      case ModelProvider.gemma:
        instance = this.createOllamaProvider(config);
        break;
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    this.instances.set(cacheKey, instance);
    return instance;
  }

  /**
   * Create Anthropic Claude provider
   */
  private static createAnthropicProvider(config?: ProviderConfig) {
    const apiKey = config?.apiKey || llmConfig.anthropic.apiKey;
    
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required for Claude provider');
    }

    console.info('Initializing Claude provider');
    
    return createAnthropic({
      apiKey,
      baseURL: config?.baseURL,
    });
  }

  /**
   * Create OpenAI provider
   */
  private static createOpenAIProvider(config?: ProviderConfig) {
    const apiKey = config?.apiKey || llmConfig.openai.apiKey;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for OpenAI provider');
    }

    console.info('Initializing OpenAI provider');
    
    return createOpenAI({
      apiKey,
      baseURL: config?.baseURL,
    });
  }

  /**
   * Create Google Gemini provider
   */
  private static createGoogleProvider(config?: ProviderConfig) {
    const apiKey = config?.apiKey || llmConfig.google.apiKey;
    
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is required for Google provider');
    }

    console.info('Initializing Google Gemini provider');
    
    return createGoogleGenerativeAI({
      apiKey,
      baseURL: config?.baseURL,
    });
  }

  /**
   * Create DeepSeek provider (using OpenAI-compatible API)
   */
  private static createDeepSeekProvider(config?: ProviderConfig) {
    const apiKey = config?.apiKey || process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      console.warn('DEEPSEEK_API_KEY not found - DeepSeek provider may not work');
    }

    console.info('Initializing DeepSeek provider');
    
    return createOpenAI({
      apiKey: apiKey || 'dummy-key',
      baseURL: config?.baseURL || llmConfig.deepseek.baseURL,
    });
  }

  /**
   * Create Ollama provider for local models
   */
  private static createOllamaProvider(config?: ProviderConfig) {
    const baseURL = config?.baseURL || llmConfig.ollama.baseURL;
    
    console.info(`Initializing Ollama provider at ${baseURL}`);
    
    return createOpenAI({
      apiKey: 'not-required', // Ollama doesn't need API key
      baseURL,
    });
  }

  /**
   * Get default model for provider
   */
  static getDefaultModel(provider: ModelProvider): ModelName {
    return DEFAULT_MODEL[provider];
  }

  /**
   * Resolve and validate a model name for a provider.
   * Falls back to the provider's default if the name is missing or invalid.
   */
  static resolveModelName(provider: ModelProvider, modelName?: string): ModelName {
    if (!modelName) {
      return this.getDefaultModel(provider);
    }

    const valid = VALID_MODELS[provider];
    if (valid.includes(modelName as ModelName)) {
      return modelName as ModelName;
    }

    const fallback = this.getDefaultModel(provider);
    console.warn(
      `Invalid model "${modelName}" for provider "${provider}", falling back to "${fallback}"`
    );
    return fallback;
  }

  /**
   * Get language model instance
   */
  static getLanguageModel(
    provider: ModelProvider,
    modelName?: string,
    config?: ProviderConfig
  ): LanguageModel {
    const providerInstance = this.getProvider(provider, config);
    const model = this.resolveModelName(provider, modelName);

    return providerInstance(model);
  }

  /**
   * Check if provider is available (has required credentials)
   */
  static isProviderAvailable(provider: ModelProvider): boolean {
    switch (provider) {
      case ModelProvider.claude:
        return Boolean(llmConfig.anthropic.apiKey);
      
      case ModelProvider.openai:
        return Boolean(llmConfig.openai.apiKey);
      
      case ModelProvider.google:
        return Boolean(llmConfig.google.apiKey);
      
      case ModelProvider.deepseek:
        return Boolean(process.env.DEEPSEEK_API_KEY);
      
      case ModelProvider.gemma:
        return true; // Ollama is always available if running
      
      default:
        return false;
    }
  }

  /**
   * Get list of available providers
   */
  static getAvailableProviders(): ModelProvider[] {
    return Object.values(ModelProvider).filter(provider => 
      this.isProviderAvailable(provider)
    );
  }

  /**
   * Get recommended provider based on availability and use case
   */
  static getRecommendedProvider(): ModelProvider {
    const available = this.getAvailableProviders();
    
    // Priority order: Claude > OpenAI > Google > DeepSeek > Gemma
    const priority = [
      ModelProvider.claude,
      ModelProvider.openai,
      ModelProvider.google,
      ModelProvider.deepseek,
      ModelProvider.gemma,
    ];

    for (const provider of priority) {
      if (available.includes(provider)) {
        return provider;
      }
    }

    throw new Error('No LLM providers are available. Check your API keys.');
  }

  /**
   * Clear provider cache (useful for testing)
   */
  static clearCache(): void {
    this.instances.clear();
  }
}

// Export convenience functions
export function createLLMProvider(
  provider: ModelProvider,
  modelName?: string,
  config?: ProviderConfig
): LanguageModel {
  return LLMProviderFactory.getLanguageModel(provider, modelName, config);
}

export function getAvailableProviders(): ModelProvider[] {
  return LLMProviderFactory.getAvailableProviders();
}

export function getRecommendedProvider(): ModelProvider {
  return LLMProviderFactory.getRecommendedProvider();
}

// Export provider instances for common use cases
export const claudeProvider = () => createLLMProvider(ModelProvider.claude);
export const openaiProvider = () => createLLMProvider(ModelProvider.openai);
export const googleProvider = () => createLLMProvider(ModelProvider.google);
export const deepseekProvider = () => createLLMProvider(ModelProvider.deepseek);
export const gemmaProvider = () => createLLMProvider(ModelProvider.gemma);