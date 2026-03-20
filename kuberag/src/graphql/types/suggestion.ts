/**
 * Pothos type registrations for AI suggestion types:
 * SuggestionItem, SuggestImprovementsResult
 */

import type { SchemaBuilder } from '../schema';

export type SuggestionType = 'ADD_NODE' | 'ADD_CONNECTION';

export interface SuggestionItem {
    type: SuggestionType;
    nodeType?: string;
    fromNodeId?: string;
    toNodeId?: string;
    reason: string;
}

export interface SuggestImprovementsResult {
    suggestions: SuggestionItem[];
}

export function registerSuggestionTypes(builder: SchemaBuilder) {
    // SuggestionItem
    const SuggestionItemRef = builder.objectRef<SuggestionItem>('SuggestionItem');
    SuggestionItemRef.implement({
        fields: (t) => ({
            type: t.exposeString('type'),
            nodeType: t.exposeString('nodeType', { nullable: true }),
            fromNodeId: t.exposeString('fromNodeId', { nullable: true }),
            toNodeId: t.exposeString('toNodeId', { nullable: true }),
            reason: t.exposeString('reason'),
        }),
    });

    // SuggestImprovementsResult
    const SuggestImprovementsResultRef = builder.objectRef<SuggestImprovementsResult>('SuggestImprovementsResult');
    SuggestImprovementsResultRef.implement({
        fields: (t) => ({
            suggestions: t.field({
                type: [SuggestionItemRef],
                resolve: (parent) => parent.suggestions,
            }),
        }),
    });
}
