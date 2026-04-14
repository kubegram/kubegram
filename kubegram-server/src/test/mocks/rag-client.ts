import { vi } from 'vitest';

export interface CodegenJobResponse {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  error?: string;
}

export interface CodegenStatusResponse {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface CodegenArtifact {
  name: string;
  content: string;
  type: 'file' | 'directory' | 'metadata';
  size?: number;
  checksum?: string;
}

export interface CodegenResultsResponse {
  artifacts: CodegenArtifact[];
  summary?: {
    totalFiles: number;
    totalSize: number;
  };
}

export interface PlanJobResponse {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
}

export interface PlanStatusResponse {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
}

export interface PlanResultsResponse {
  plan: {
    resources: Array<{
      type: string;
      name: string;
      namespace?: string;
    }>;
    dependencies: Array<{
      from: string;
      to: string;
      type: string;
    }>;
  };
}

export interface ValidationJobResponse {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface ValidationStatusResponse {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
}

export interface ValidationResult {
  resource: string;
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
}

export interface ValidationResultsResponse {
  results: ValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

export interface Suggestion {
  type: 'optimization' | 'security' | 'best-practice' | 'error';
  message: string;
  resource?: string;
  line?: number;
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
}

export type RAGJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface MockRAGClientOptions {
  codegenJobId?: string;
  codegenStatus?: CodegenStatusResponse;
  codegenResults?: CodegenResultsResponse;
  planJobId?: string;
  planStatus?: PlanStatusResponse;
  planResults?: PlanResultsResponse;
  validationJobId?: string;
  validationStatus?: ValidationStatusResponse;
  validationResults?: ValidationResultsResponse;
  suggestions?: SuggestionsResponse;
  errorDelay?: number;
}

export function createMockRAGClient(options: MockRAGClientOptions = {}) {
  const {
    codegenJobId = 'mock-codegen-job-001',
    codegenStatus = {
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
    },
    codegenResults = {
      artifacts: [
        {
          name: 'deployment.yaml',
          content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: nginx:latest
        ports:
        - containerPort: 80`,
          type: 'file',
          size: 512,
          checksum: 'abc123',
        },
        {
          name: 'service.yaml',
          content: `apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP`,
          type: 'file',
          size: 256,
        },
      ],
      summary: {
        totalFiles: 2,
        totalSize: 768,
      },
    },
    planJobId = 'mock-plan-job-001',
    planStatus = {
      status: 'completed',
      progress: 100,
    },
    planResults = {
      plan: {
        resources: [
          { type: 'Deployment', name: 'my-app' },
          { type: 'Service', name: 'my-app-service' },
          { type: 'ConfigMap', name: 'my-app-config' },
        ],
        dependencies: [
          { from: 'my-app', to: 'my-app-service', type: 'exposes' },
          { from: 'my-app', to: 'my-app-config', type: 'uses' },
        ],
      },
    },
    validationJobId = 'mock-validation-job-001',
    validationStatus = {
      status: 'completed',
      progress: 100,
    },
    validationResults = {
      results: [
        {
          resource: 'deployment.yaml',
          valid: true,
          errors: [],
        },
        {
          resource: 'service.yaml',
          valid: true,
          errors: [],
        },
      ],
      summary: {
        total: 2,
        valid: 2,
        invalid: 0,
      },
    },
    suggestions = {
      suggestions: [
        {
          type: 'optimization',
          message: 'Consider setting resource limits for the container',
          resource: 'deployment.yaml',
        },
        {
          type: 'security',
          message: 'Container is running as root. Consider using a non-root user.',
          resource: 'deployment.yaml',
        },
      ],
    },
    errorDelay = 0,
  } = options;

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return {
    initializeCodeGen: vi.fn().mockImplementation(async () => {
      if (errorDelay > 0) await sleep(errorDelay);
      return {
        jobId: codegenJobId,
        status: 'pending',
      };
    }),

    getCodeGenStatus: vi.fn().mockImplementation(async () => {
      if (errorDelay > 0) await sleep(errorDelay);
      return codegenStatus;
    }),

    getCodeGenResults: vi.fn().mockImplementation(async () => {
      if (errorDelay > 0) await sleep(errorDelay);
      return codegenResults;
    }),

    initializePlan: vi.fn().mockImplementation(async () => {
      if (errorDelay > 0) await sleep(errorDelay);
      return {
        jobId: planJobId,
        status: 'pending',
      };
    }),

    getPlanStatus: vi.fn().mockImplementation(async () => {
      if (errorDelay > 0) await sleep(errorDelay);
      return planStatus;
    }),

    getPlanResults: vi.fn().mockImplementation(async () => {
      if (errorDelay > 0) await sleep(errorDelay);
      return planResults;
    }),

    initializeValidation: vi.fn().mockImplementation(async () => {
      if (errorDelay > 0) await sleep(errorDelay);
      return {
        jobId: validationJobId,
        status: 'pending',
      };
    }),

    getValidationStatus: vi.fn().mockImplementation(async () => {
      if (errorDelay > 0) await sleep(errorDelay);
      return validationStatus;
    }),

    getValidationResults: vi.fn().mockImplementation(async () => {
      if (errorDelay > 0) await sleep(errorDelay);
      return validationResults;
    }),

    getSuggestions: vi.fn().mockImplementation(async () => {
      if (errorDelay > 0) await sleep(errorDelay);
      return suggestions;
    }),

    updateCodegenStatus: vi.fn().mockResolvedValue(undefined),
    cancelJob: vi.fn().mockResolvedValue({ success: true }),
  };
}

export const MOCK_RAG_PRESETS = {
  pending: {
    codegenStatus: { status: 'pending' as const, progress: 0 },
    planStatus: { status: 'pending' as const, progress: 0 },
    validationStatus: { status: 'pending' as const, progress: 0 },
  },
  running: {
    codegenStatus: { status: 'running' as const, progress: 50 },
    planStatus: { status: 'running' as const, progress: 50 },
    validationStatus: { status: 'running' as const, progress: 50 },
  },
  completed: {
    codegenStatus: { status: 'completed' as const, progress: 100 },
    planStatus: { status: 'completed' as const, progress: 100 },
    validationStatus: { status: 'completed' as const, progress: 100 },
  },
  failed: {
    codegenStatus: { status: 'failed' as const, progress: 50, error: 'LLM provider error' },
    planStatus: { status: 'failed' as const, progress: 50 },
    validationStatus: { status: 'failed' as const, progress: 50 },
  },
};

export function createMockRAGClientWithStatus(status: keyof typeof MOCK_RAG_PRESETS) {
  const preset = MOCK_RAG_PRESETS[status];
  return createMockRAGClient(preset);
}

export function createMockRAGClientWithError(error: string) {
  return createMockRAGClient({
    codegenStatus: {
      status: 'failed',
      progress: 0,
      error,
    },
  });
}

export function createMockRAGClientWithDelay(delayMs: number) {
  return createMockRAGClient({}, { errorDelay: delayMs });
}
