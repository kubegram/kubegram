import type { LlmProvider } from '@/store/api/providers';
/**
 * Canvas state types - Re-exports from modular type files
 */



// Re-export all modular types
export * from './types/configs';
export * from './types/activity';
export * from './types/data';
export * from './types/entities';

/**
 * Main canvas state interface
 * Composes all modular types into a single state structure
 */
export interface CanvasState {
  // Canvas configuration
  configs: import('./types/configs').CanvasConfigs;

  // User activity and interactions
  activity: import('./types/activity').CanvasActivity;

  // Data storage
  graphsMetadata: import('./types/data').GraphsMetadata;
  canvasElementsLookup: import('./types/data').CanvasElementsLookup;

  // Entity information
  user: import('./types/entities').UserInfo;
  organization: import('./types/entities').OrganizationInfo;
  company: import('./types/entities').CompanyInfo;
  projects: Record<string, import('./types/entities').ProjectInfo>;
  llmConfigs: LlmProvider[];
  selectedLlmProvider?: string;
  selectedLlmModel?: string;
  activeGraph: import('./types/entities').ActiveGraphInfo;
}
