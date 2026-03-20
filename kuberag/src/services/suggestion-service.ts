/**
 * Suggestion service — synchronous LLM call to generate AI canvas suggestions.
 * Returns in < 2 s using a fast model (Haiku / DeepSeek).
 */

import { generateText } from 'ai';
import { LLMProviderFactory } from '../llm/providers.js';
import { ModelProvider, ModelName } from '../types/enums.js';
import type { SuggestionItem, SuggestImprovementsResult } from '../graphql/types/suggestion.js';

interface GraphNode {
    id: string;
    type?: string;
    label?: string;
    data?: { label?: string; type?: string };
}

interface GraphEdge {
    id?: string;
    source?: string;
    sourceId?: string;
    target?: string;
    targetId?: string;
}

interface GraphInput {
    nodes?: GraphNode[];
    edges?: GraphEdge[];
    connections?: GraphEdge[];
}

/**
 * Build a compact human-readable graph summary for the prompt.
 */
function buildGraphSummary(graph: GraphInput): { nodesSummary: string; connectionsSummary: string } {
    const nodes = graph.nodes ?? [];
    const edges = graph.edges ?? graph.connections ?? [];

    const nodesSummary = nodes
        .map((n) => {
            const type = n.type ?? n.data?.type ?? 'UNKNOWN';
            const label = n.label ?? n.data?.label ?? n.id;
            return `${type}:${label}`;
        })
        .join(', ');

    // Build a lookup for node labels
    const labelById = new Map(
        nodes.map((n) => [n.id, n.label ?? n.data?.label ?? n.id])
    );

    const connectionsSummary = edges
        .map((e) => {
            const from = labelById.get(e.source ?? e.sourceId ?? '') ?? e.source ?? e.sourceId ?? '?';
            const to = labelById.get(e.target ?? e.targetId ?? '') ?? e.target ?? e.targetId ?? '?';
            return `${from}→${to}`;
        })
        .join(', ');

    return { nodesSummary: nodesSummary || 'none', connectionsSummary: connectionsSummary || 'none' };
}

/**
 * Pick the fastest available provider/model for suggestions.
 */
function getFastModel(modelProvider?: string, modelName?: string) {
    if (modelProvider) {
        const provider = modelProvider as ModelProvider;
        const model = modelName ?? undefined;
        return LLMProviderFactory.getLanguageModel(provider, model);
    }

    // Priority: Haiku → GPT-4o-mini → Gemini Flash → DeepSeek Chat → fallback recommended
    const fastModels: Array<[ModelProvider, ModelName]> = [
        [ModelProvider.claude, ModelName.CLAUDE_HAIKU],
        [ModelProvider.openai, ModelName.GPT_4O_MINI],
        [ModelProvider.google, ModelName.GEMINI_FLASH],
        [ModelProvider.deepseek, ModelName.DEEPSEEK_CHAT],
    ];

    for (const [provider, model] of fastModels) {
        if (LLMProviderFactory.isProviderAvailable(provider)) {
            return LLMProviderFactory.getLanguageModel(provider, model);
        }
    }

    // Last resort: whatever is recommended
    const recommended = LLMProviderFactory.getRecommendedProvider();
    return LLMProviderFactory.getLanguageModel(recommended);
}

const SUGGESTION_PROMPT = (nodesSummary: string, connectionsSummary: string) => `\
You are a Kubernetes infrastructure advisor. Given this infrastructure graph:

Nodes: ${nodesSummary}
Connections: ${connectionsSummary}

Suggest 2-3 improvements that would make this infrastructure more robust, observable, or secure.
Return ONLY valid JSON — an array of suggestion objects, nothing else:

[
  {
    "type": "ADD_NODE" | "ADD_CONNECTION",
    "nodeType": "<GraphNodeType if type is ADD_NODE, otherwise omit>",
    "fromNodeId": "<source node id if type is ADD_CONNECTION, otherwise omit>",
    "toNodeId": "<target node id if type is ADD_CONNECTION, otherwise omit>",
    "reason": "<one concise sentence explaining the benefit>"
  }
]

Valid nodeType values: DEPLOYMENT, SERVICE, INGRESS, CONFIGMAP, SECRET, HORIZONTALPODAUTOSCALER, MONITORING, CACHE, DATABASE, LOAD_BALANCER, GATEWAY, NETWORKPOLICY, PERSISTENTVOLUMECLAIM.
Only output the JSON array. Do not include any explanation outside the JSON.`;

export class SuggestionService {
    async getSuggestions(
        graph: GraphInput,
        modelProvider?: string,
        modelName?: string
    ): Promise<SuggestImprovementsResult> {
        const nodes = graph.nodes ?? [];

        // Need at least 1 node to produce meaningful suggestions
        if (nodes.length === 0) {
            return { suggestions: [] };
        }

        const { nodesSummary, connectionsSummary } = buildGraphSummary(graph);

        try {
            const model = getFastModel(modelProvider, modelName);

            const { text } = await generateText({
                model,
                prompt: SUGGESTION_PROMPT(nodesSummary, connectionsSummary),
                maxTokens: 512,
            });

            const suggestions = parseSuggestions(text);
            return { suggestions };
        } catch (error) {
            console.error('SuggestionService: LLM call failed', error);
            return { suggestions: [] };
        }
    }
}

function parseSuggestions(text: string): SuggestionItem[] {
    try {
        // Strip markdown code fences if present
        const cleaned = text.replace(/```(?:json)?/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (!Array.isArray(parsed)) return [];

        return parsed
            .filter(
                (item): item is SuggestionItem =>
                    typeof item === 'object' &&
                    item !== null &&
                    (item.type === 'ADD_NODE' || item.type === 'ADD_CONNECTION') &&
                    typeof item.reason === 'string'
            )
            .slice(0, 5); // Cap at 5 suggestions
    } catch {
        console.warn('SuggestionService: failed to parse LLM JSON response', text.slice(0, 200));
        return [];
    }
}

export const suggestionService = new SuggestionService();
