/**
 * LLM output parsing utilities
 * Port of parse_llm_manifests_output() from app/agent/prompts/core.py
 * Handles JSON extraction, repair, and validation
 */

// LLM output structure interface
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

// Parsed manifests response interface
export interface ParsedManifestsResponse {
  manifests: CodegenLLMOutput[];
}

/**
 * LLM output parser class
 * Provides robust parsing with JSON repair capabilities
 */
export class LLMOutputParser {
  /**
   * Parse JSON output from LLM into CodegenLLMOutput objects
   * 
   * @param llmOutput - JSON string or content from LLM containing manifests array
   * @returns - Array of CodegenLLMOutput objects
   * @throws - Error if parsing fails and cannot be repaired
   */
  static parseManifestsOutput(llmOutput: string): CodegenLLMOutput[] {
    // Extract content string if needed
    const content = this.extractContent(llmOutput);

    if (!content || !content.trim()) {
      throw new Error(`LLM returned empty content. Full response: ${llmOutput}`);
    }

    // Clean up markdown code blocks
    const cleanedContent = this.cleanMarkdownCodeBlocks(content);

    // Parse the JSON string
    let parsedJson: ParsedManifestsResponse;
    
    try {
      parsedJson = JSON.parse(cleanedContent);
    } catch (error) {
      // Attempt to repair incomplete JSON
      console.warn('Failed to parse JSON, attempting repair...');
      const repairedContent = this.repairIncompleteJSON(cleanedContent);
      
      try {
        parsedJson = JSON.parse(repairedContent);
        console.info('Successfully repaired incomplete JSON');
      } catch (repairError) {
        // If repair fails, save content for debugging and throw error
        this.saveErrorContent(cleanedContent);
        throw new Error(
          `Failed to parse LLM response as JSON. Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Validate that 'manifests' key exists
    if (!parsedJson.manifests) {
      throw new Error("JSON output must contain 'manifests' key");
    }

    // Validate that manifests is a list
    if (!Array.isArray(parsedJson.manifests)) {
      throw new Error("'manifests' must be a list");
    }

    // Convert each manifest to CodegenLLMOutput
    const result: CodegenLLMOutput[] = [];

    for (let idx = 0; idx < parsedJson.manifests.length; idx++) {
      const manifest = parsedJson.manifests[idx];

      // Validate required fields
      if (!manifest.file_name) {
        throw new Error(`Manifest at index ${idx} is missing 'file_name' field`);
      }
      if (!manifest.generated_code) {
        throw new Error(`Manifest at index ${idx} is missing 'generated_code' field`);
      }

      // Create CodegenLLMOutput object with defaults for optional fields
      const codegenOutput: CodegenLLMOutput = {
        file_name: manifest.file_name,
        generated_code: manifest.generated_code,
        assumptions: manifest.assumptions || [],
        decisions: manifest.decisions || [],
        commands: manifest.commands,
        entity_name: manifest.entity_name || '',
        entity_id: manifest.entity_id,
        entity_type: manifest.entity_type,
      };

      result.push(codegenOutput);
    }

    return result;
  }

  /**
   * Extract content from various input types
   */
  private static extractContent(llmOutput: any): string {
    if (typeof llmOutput === 'string') {
      return llmOutput;
    }
    
    // Handle other potential input types (AIMessage, etc.)
    if (llmOutput && typeof llmOutput === 'object' && 'content' in llmOutput) {
      return String(llmOutput.content);
    }
    
    return String(llmOutput);
  }

  /**
   * Clean up markdown code blocks
   */
  private static cleanMarkdownCodeBlocks(content: string): string {
    let cleaned = content.trim();

    // Remove opening code block markers
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }

    // Remove closing code block markers
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    return cleaned.trim();
  }

  /**
   * Attempt to repair incomplete JSON
   * Common case: LLM stops mid-stream, leaving an incomplete object in the manifests array
   */
  private static repairIncompleteJSON(content: string): string {
    // Look for manifests array start
    const manifestsStart = content.indexOf('"manifests":');
    if (manifestsStart === -1) {
      throw new Error('Cannot find manifests array in JSON');
    }

    // Find the last closing brace of an object inside the array
    // We expect objects like {...}, {...}
    const lastSeparator = content.lastIndexOf('},');

    if (lastSeparator !== -1 && lastSeparator > manifestsStart) {
      // Truncate after the last valid object
      const repairedContent = content.substring(0, lastSeparator + 1) + ']}';
      return repairedContent;
    }

    // Fallback: look for last closing brace
    const subset = content.substring(manifestsStart);
    const lastBrace = subset.lastIndexOf('}');
    
    if (lastBrace !== -1) {
      const absLastBrace = manifestsStart + lastBrace;
      const repairedContent = content.substring(0, absLastBrace + 1) + ']}';
      return repairedContent;
    }

    throw new Error('Cannot repair incomplete JSON - no valid objects found');
  }

  /**
   * Save error content to file for debugging
   */
  private static saveErrorContent(content: string): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `llm_error_${timestamp}.txt`;
      
      // In a real implementation, you might save to a logs directory
      console.error(`Failed to parse LLM content. Content length: ${content.length}`);
      console.error(`First 500 chars: ${content.substring(0, 500)}...`);
      
      // For debugging purposes, you could write to a file
      // import { writeFileSync } from 'fs';
      // writeFileSync(`./logs/${filename}`, content);
    } catch (error) {
      console.error('Failed to save error content:', error);
    }
  }

  /**
   * Validate and sanitize a single manifest
   */
  static validateManifest(manifest: any): CodegenLLMOutput {
    if (!manifest || typeof manifest !== 'object') {
      throw new Error('Manifest must be an object');
    }

    if (!manifest.file_name || typeof manifest.file_name !== 'string') {
      throw new Error('Manifest must have a valid file_name string');
    }

    if (!manifest.generated_code || typeof manifest.generated_code !== 'string') {
      throw new Error('Manifest must have valid generated_code string');
    }

    // Sanitize file name
    const fileName = manifest.file_name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();

    return {
      file_name: fileName,
      generated_code: manifest.generated_code,
      assumptions: Array.isArray(manifest.assumptions) ? manifest.assumptions : [],
      decisions: Array.isArray(manifest.decisions) ? manifest.decisions : [],
      commands: Array.isArray(manifest.commands) ? manifest.commands : undefined,
      entity_name: manifest.entity_name || '',
      entity_id: manifest.entity_id,
      entity_type: manifest.entity_type,
    };
  }

  /**
   * Extract YAML from mixed content
   */
  static extractYAML(content: string): string[] {
    const yamlBlocks: string[] = [];
    
    // Look for YAML code blocks
    const yamlRegex = /```yaml\n([\s\S]*?)\n```/g;
    let match;
    
    while ((match = yamlRegex.exec(content)) !== null) {
      yamlBlocks.push(match[1].trim());
    }
    
    // If no YAML blocks found, try to extract YAML-like content
    if (yamlBlocks.length === 0) {
      // Look for content that starts with common Kubernetes resources
      const k8sRegex = /(apiVersion|kind|metadata|spec):\s*\n/g;
      if (k8sRegex.test(content)) {
        yamlBlocks.push(content.trim());
      }
    }
    
    return yamlBlocks;
  }

  /**
   * Parse multiple YAML documents from content
   */
  static parseYAMLDocuments(content: string): string[] {
    const documents: string[] = [];
    
    // Split by document separator (---)
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

// Export convenience functions
export function parseLLMManifestsOutput(llmOutput: string): CodegenLLMOutput[] {
  return LLMOutputParser.parseManifestsOutput(llmOutput);
}

export function validateManifest(manifest: any): CodegenLLMOutput {
  return LLMOutputParser.validateManifest(manifest);
}

export function extractYAML(content: string): string[] {
  return LLMOutputParser.extractYAML(content);
}

export function parseYAMLDocuments(content: string): string[] {
  return LLMOutputParser.parseYAMLDocuments(content);
}