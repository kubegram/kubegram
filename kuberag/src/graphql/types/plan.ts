/**
 * Pothos type registrations for plan workflow types:
 * PlanResult, PlanJobStatus
 */

import type { SchemaBuilder } from '../schema';
import { JobStatusStatusEnum } from './enums';
import type { PlanJobStatus } from '../../services/plan-service';
import type { Graph } from '../../types/graph';

export interface PlanResult {
    graph: Graph;
    context: string[];
}

export function registerPlanTypes(builder: SchemaBuilder) {
    // PlanJobStatus
    const PlanJobStatusRef = builder.objectRef<PlanJobStatus>('PlanJobStatus');
    PlanJobStatusRef.implement({
        fields: (t) => ({
            jobId: t.exposeString('jobId'),
            step: t.exposeString('step'),
            status: t.exposeString('status'), // Using string for now to avoid enum conflict if needed, or map to enum
            error: t.exposeString('error', { nullable: true }),
            createdAt: t.exposeString('createdAt'),
            updatedAt: t.exposeString('updatedAt'),
            userRequest: t.exposeString('userRequest'),
        }),
    });

    // PlanResult
    const PlanResultRef = builder.objectRef<PlanResult>('PlanResult');
    PlanResultRef.implement({
        fields: (t) => ({
            graph: t.field({
                type: 'Graph',
                resolve: (parent) => parent.graph,
            }),
            context: t.exposeStringList('context'),
        }),
    });
}
