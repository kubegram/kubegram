/**
 * Pothos type registrations for suggestion inputs
 */

import type { SchemaBuilder } from '../schema';

export function registerSuggestionInputTypes(builder: SchemaBuilder) {
    builder.inputType('SuggestImprovementsInput', {
        fields: (t) => ({
            graph: t.field({ type: 'GraphInput', required: true }),
            modelProvider: t.string({ required: false }),
            modelName: t.string({ required: false }),
        }),
    });
}
