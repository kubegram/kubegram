/**
 * LLM Provider Utilities
 * 
 * Handles provider name normalization and validation for API calls.
 * UI components use lowercase providers for better UX,
 * while API calls require uppercase format.
 */

/**
 * Valid LLM providers with their uppercase API format
 */
export const VALID_PROVIDERS = {
  OPENAI: 'OPENAI',
  ANTHROPIC: 'ANTHROPIC', 
  GOOGLE: 'GOOGLE',
  AZURE: 'AZURE',
  DEEPSEEK: 'DEEPSEEK'
} as const;

/**
 * Mapping from lowercase UI format to uppercase API format
 */
export const PROVIDER_MAPPING = {
  'openai': 'OPENAI',
  'anthropic': 'ANTHROPIC',
  'google': 'GOOGLE', 
  'azure': 'AZURE',
  'deepseek': 'DEEPSEEK'
} as const;

/**
 * Mapping from uppercase API format back to lowercase UI format
 */
export const REVERSE_PROVIDER_MAPPING = {
  'OPENAI': 'openai',
  'ANTHROPIC': 'anthropic',
  'GOOGLE': 'google',
  'AZURE': 'azure',
  'DEEPSEEK': 'deepseek'
} as const;

/**
 * Type definitions for provider names
 */
export type UppercaseProvider = keyof typeof VALID_PROVIDERS;
export type LowercaseProvider = keyof typeof PROVIDER_MAPPING;
export type ValidProvider = LowercaseProvider | UppercaseProvider;

/**
 * Transforms provider name to uppercase format for API calls
 * 
 * @param provider - Provider name in any format (lowercase, uppercase, or mixed)
 * @returns Provider name in uppercase API format
 */
export const normalizeProviderForApi = (provider: string): UppercaseProvider => {
  if (!provider) {
    throw new Error('Provider name is required');
  }

  // Convert to lowercase for mapping lookup
  const lowercaseProvider = provider.toLowerCase();
  
  // Check if it's a valid provider
  const mappedProvider = PROVIDER_MAPPING[lowercaseProvider as LowercaseProvider];
  
  if (!mappedProvider) {
    throw new Error(`Invalid provider: "${provider}". Valid providers are: ${Object.keys(PROVIDER_MAPPING).join(', ')}`);
  }

  return mappedProvider as UppercaseProvider;
};

/**
 * Transforms provider name from API format to lowercase for UI display
 * 
 * @param provider - Provider name in uppercase API format
 * @returns Provider name in lowercase UI format
 */
export const normalizeProviderForUi = (provider: string): LowercaseProvider => {
  if (!provider) {
    throw new Error('Provider name is required');
  }

  // Convert to uppercase for mapping lookup
  const uppercaseProvider = provider.toUpperCase();
  
  // Check if it's a valid provider
  const mappedProvider = REVERSE_PROVIDER_MAPPING[uppercaseProvider as UppercaseProvider];
  
  if (!mappedProvider) {
    throw new Error(`Invalid provider: "${provider}". Valid providers are: ${Object.keys(REVERSE_PROVIDER_MAPPING).join(', ')}`);
  }

  return mappedProvider as LowercaseProvider;
};

/**
 * Validates if a provider name is supported
 * 
 * @param provider - Provider name in any format
 * @returns true if provider is valid, false otherwise
 */
export const isValidProvider = (provider: string): boolean => {
  try {
    normalizeProviderForApi(provider);
    return true;
  } catch {
    return false;
  }
};

/**
 * Gets default provider in lowercase format
 */
export const DEFAULT_PROVIDER: LowercaseProvider = 'deepseek';

/**
 * Gets all available providers in lowercase format (for UI)
 */
export const getAvailableProviders = (): LowercaseProvider[] => {
  return Object.keys(PROVIDER_MAPPING) as LowercaseProvider[];
};

/**
 * Gets all available providers in uppercase format (for API)
 */
export const getAvailableProvidersForApi = (): UppercaseProvider[] => {
  return Object.values(VALID_PROVIDERS);
};