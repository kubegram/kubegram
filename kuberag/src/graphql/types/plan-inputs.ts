/**
 * Pothos type registrations for plan inputs
 */

import type { SchemaBuilder } from '../schema';

export function registerPlanInputTypes(builder: SchemaBuilder) {
    builder.inputType('InitializePlanInput', {
        fields: (t) => ({
            graph: t.field({ type: 'GraphInput', required: true }),
            userRequest: t.string({ required: false }),
            modelProvider: t.string({ required: false }),
            modelName: t.string({ required: false }),
        }),
    });
}
