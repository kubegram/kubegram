/**
 * System prompt builder
 * Copied from kuberag
 */

export class SystemPromptBuilder {
  build(nodeType: string, context?: string): string {
    return `Generate Kubernetes manifest for ${nodeType}`;
  }
}

export const systemPromptBuilder = new SystemPromptBuilder();
