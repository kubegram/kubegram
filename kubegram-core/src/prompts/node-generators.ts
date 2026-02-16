/**
 * Node prompt generators
 * Copied from kuberag
 */

export function generateNodePrompt(nodeType: string, nodeData: any): string {
  return `Generate Kubernetes manifest for ${nodeType} with name ${nodeData.name}`;
}
