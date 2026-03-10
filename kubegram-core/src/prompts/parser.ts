/**
 * LLM output parser with Zod validation and retry strategies
 * Ported from kuberag with enhanced validation and structured output support
 */

import { z } from 'zod';
import type { LanguageModel } from 'ai';

export interface CodegenLLMOutput {
  generated_code: string;
  file_name: string;
  assumptions: string[];
  decisions: string[];
  commands?: string[];
  entity_name: string;
  entity_id?: string;
  entity_type?: string;
}

export interface ParsedManifestsResponse {
  manifests: CodegenLLMOutput[];
}

const ManifestSchema = z.object({
  file_name: z.string(),
  generated_code: z.string(),
  assumptions: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
  commands: z.array(z.string()).optional(),
  entity_name: z.string(),
  entity_id: z.string().optional(),
  entity_type: z.string().optional(),
});

const ManifestsResponseSchema = z.object({
  manifests: z.array(ManifestSchema),
});

export type ParsedManifest = z.infer<typeof ManifestSchema>;

export class LLMOutputParser {
  static async parseManifests(
    llmOutput: string,
    model?: LanguageModel
  ): Promise<ParsedManifest[]> {
    const content = this.extractContent(llmOutput);

    if (!content || !content.trim()) {
      throw new Error('LLM returned empty content');
    }

    const cleanedContent = this.cleanMarkdownCodeBlocks(content);

    // Strategy 1: direct JSON parse + Zod validation (fast path, most common)
    try {
      const parsed = JSON.parse(cleanedContent);
      const validated = ManifestsResponseSchema.parse(parsed);
      return validated.manifests;
    } catch {
      // Fall through to next strategy
    }

    // Strategy 2: extract JSON from a ```json … ``` fenced block
    const jsonMatch = cleanedContent.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        const validated = ManifestsResponseSchema.parse(parsed);
        return validated.manifests;
      } catch {
        // Fall through to next strategy
      }
    }

    // Strategy 3: re-prompt the LLM using structured output (generateObject).
    // Only attempted when a model is provided — adds latency but recovers from
    // ambiguous or narrative LLM responses.
    if (model) {
      try {
        const { generateObject } = await import('ai');
        const { object } = await generateObject({
          model,
          schema: ManifestsResponseSchema,
          prompt: `Parse this LLM output into structured manifest objects:\n\n${content}`,
        });
        return object.manifests;
      } catch {
        // Fall through to next strategy
      }
    }

    // Strategy 4: treat raw text as YAML documents separated by ---
    // Last resort; results lack metadata (assumptions, decisions, entity_id).
    const yamlDocs = cleanedContent.split(/^---$/m).filter(s => s.trim());
    if (yamlDocs.length > 0) {
      return yamlDocs.map((content, i) => ({
        file_name: `manifest-${i + 1}.yaml`,
        generated_code: content.trim(),
        assumptions: [],
        decisions: [],
        entity_name: `resource-${i + 1}`,
      }));
    }

    return [];
  }

  static parseManifestsSync(llmOutput: string): ParsedManifest[] {
    const content = this.extractContent(llmOutput);

    if (!content || !content.trim()) {
      return [];
    }

    const cleanedContent = this.cleanMarkdownCodeBlocks(content);

    try {
      const parsed = JSON.parse(cleanedContent);
      const validated = ManifestsResponseSchema.parse(parsed);
      return validated.manifests;
    } catch {
      // Fall through
    }

    const jsonMatch = cleanedContent.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        const validated = ManifestsResponseSchema.parse(parsed);
        return validated.manifests;
      } catch {
        // Fall through
      }
    }

    const yamlDocs = cleanedContent.split(/^---$/m).filter(s => s.trim());
    if (yamlDocs.length > 0) {
      return yamlDocs.map((content, i) => ({
        file_name: `manifest-${i + 1}.yaml`,
        generated_code: content.trim(),
        assumptions: [],
        decisions: [],
        entity_name: `resource-${i + 1}`,
      }));
    }

    return [];
  }

  private static extractContent(llmOutput: unknown): string {
    if (typeof llmOutput === 'string') {
      return llmOutput;
    }
    
    if (llmOutput && typeof llmOutput === 'object' && 'content' in llmOutput) {
      return String(llmOutput.content);
    }
    
    return String(llmOutput);
  }

  private static cleanMarkdownCodeBlocks(content: string): string {
    let cleaned = content.trim();

    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }

    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    return cleaned.trim();
  }

  static validateManifest(manifest: unknown): CodegenLLMOutput {
    const validated = ManifestSchema.parse(manifest);
    return {
      file_name: validated.file_name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_').toLowerCase(),
      generated_code: validated.generated_code,
      assumptions: validated.assumptions,
      decisions: validated.decisions,
      commands: validated.commands,
      entity_name: validated.entity_name,
      entity_id: validated.entity_id,
      entity_type: validated.entity_type,
    };
  }

  static extractYAML(content: string): string[] {
    const yamlBlocks: string[] = [];
    
    const yamlRegex = /```yaml\n([\s\S]*?)\n```/g;
    let match;
    
    while ((match = yamlRegex.exec(content)) !== null) {
      yamlBlocks.push(match[1].trim());
    }
    
    if (yamlBlocks.length === 0) {
      const k8sRegex = /(apiVersion|kind|metadata|spec):\s*\n/g;
      if (k8sRegex.test(content)) {
        yamlBlocks.push(content.trim());
      }
    }
    
    return yamlBlocks;
  }

  static parseYAMLDocuments(content: string): string[] {
    const documents: string[] = [];
    const parts = content.split('---');
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed) {
        documents.push(trimmed);
      }
    }
    
    return documents;
  }
}

export async function parseManifests(
  llmOutput: string,
  model?: LanguageModel
): Promise<ParsedManifest[]> {
  return LLMOutputParser.parseManifests(llmOutput, model);
}

export function parseLLMManifestsOutput(llmOutput: string): CodegenLLMOutput[] {
  return LLMOutputParser.parseManifestsSync(llmOutput);
}

export function validateManifest(manifest: unknown): CodegenLLMOutput {
  return LLMOutputParser.validateManifest(manifest);
}

export function extractYAML(content: string): string[] {
  return LLMOutputParser.extractYAML(content);
}

export function parseYAMLDocuments(content: string): string[] {
  return LLMOutputParser.parseYAMLDocuments(content);
}
