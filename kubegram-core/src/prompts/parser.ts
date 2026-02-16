/**
 * LLM output parser
 * Copied from kuberag
 */

export function parseLLMManifestsOutput(output: string): any[] {
  try {
    return JSON.parse(output);
  } catch {
    return [];
  }
}
