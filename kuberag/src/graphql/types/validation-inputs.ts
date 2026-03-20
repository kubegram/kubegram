/**
 * Pothos input type registrations for validation workflow
 */

import type { SchemaBuilder } from '../schema';

export function registerValidationInputTypes(builder: SchemaBuilder) {
    /**
     * ValidationInput — supplied when initiating a validation job.
     * apiSchema must be a valid OpenAPI JSON object.
     */
    builder.inputType('ValidationInput', {
        fields: (t) => ({
            graphId: t.id({ required: true }),
            namespace: t.string({ required: true }),
            /** OpenAPI spec as a JSON scalar */
            apiSchema: t.field({ type: 'JSON', required: true }),
            modelProvider: t.string({ required: false }),
            modelName: t.string({ required: false }),
        }),
    });
}
