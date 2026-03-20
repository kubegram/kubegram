/**
 * Pothos type registrations for validation workflow:
 *   ValidationJobStatus, ValidationResult, ValidationSummary, ValidationTestResult
 */

import type { SchemaBuilder } from '../schema';
import type {
    ValidationJobStatus,
    ValidationJobResult,
    ValidationTestResult,
} from '../../services/validation-service';

export function registerValidationTypes(builder: SchemaBuilder) {
    // ValidationJobStatus — returned immediately after job submission
    const ValidationJobStatusRef = builder.objectRef<ValidationJobStatus>('ValidationJobStatus');
    ValidationJobStatusRef.implement({
        fields: (t) => ({
            jobId: t.exposeString('jobId'),
            threadId: t.exposeString('threadId'),
            status: t.exposeString('status'),
            step: t.exposeString('step'),
            error: t.exposeString('error', { nullable: true }),
            createdAt: t.exposeString('createdAt'),
            updatedAt: t.exposeString('updatedAt'),
        }),
    });

    // ValidationSummary — LLM-generated analysis of test results
    interface ValidationSummary {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        analysisText: string;
    }
    const ValidationSummaryRef = builder.objectRef<ValidationSummary>('ValidationSummary');
    ValidationSummaryRef.implement({
        fields: (t) => ({
            total: t.exposeInt('total'),
            passed: t.exposeInt('passed'),
            failed: t.exposeInt('failed'),
            skipped: t.exposeInt('skipped'),
            analysisText: t.exposeString('analysisText'),
        }),
    });

    // ValidationTestResult — outcome of a single test case
    const ValidationTestResultRef = builder.objectRef<ValidationTestResult>('ValidationTestResult');
    ValidationTestResultRef.implement({
        fields: (t) => ({
            correlationId: t.exposeString('correlationId'),
            success: t.exposeBoolean('success'),
            actualStatus: t.exposeInt('actualStatus'),
            responseTimeMs: t.exposeInt('responseTimeMs'),
            error: t.exposeString('error', { nullable: true }),
        }),
    });

    // ValidationError — schema / configuration errors
    interface ValidationError {
        field: string;
        message: string;
        severity: string;
    }
    const ValidationErrorRef = builder.objectRef<ValidationError>('ValidationValidationError');
    ValidationErrorRef.implement({
        fields: (t) => ({
            field: t.exposeString('field'),
            message: t.exposeString('message'),
            severity: t.exposeString('severity'),
        }),
    });

    // ValidationResult — full result returned after job completes
    const ValidationResultRef = builder.objectRef<ValidationJobResult>('ValidationResult');
    ValidationResultRef.implement({
        fields: (t) => ({
            jobId: t.exposeString('jobId'),
            status: t.exposeString('status'),
            summary: t.field({
                type: ValidationSummaryRef,
                nullable: true,
                resolve: (parent) => parent.summary ?? null,
            }),
            testResults: t.field({
                type: [ValidationTestResultRef],
                resolve: (parent) => parent.testResults,
            }),
            errors: t.field({
                type: [ValidationErrorRef],
                resolve: (parent) => parent.errors,
            }),
        }),
    });
}
