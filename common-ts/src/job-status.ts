// the RAG system Job status
export const JOB_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type JobStatusStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];

const LEGACY_STATUS_MAP: Record<string, JobStatusStatus> = {
  pending: JOB_STATUS.PENDING,
  running: JOB_STATUS.RUNNING,
  completed: JOB_STATUS.COMPLETED,
  failed: JOB_STATUS.FAILED,
  cancelled: JOB_STATUS.CANCELLED,
  queued: JOB_STATUS.PENDING,
  started: JOB_STATUS.RUNNING,
  error: JOB_STATUS.FAILED,
  PENDING: JOB_STATUS.PENDING,
  RUNNING: JOB_STATUS.RUNNING,
  COMPLETED: JOB_STATUS.COMPLETED,
  FAILED: JOB_STATUS.FAILED,
  CANCELLED: JOB_STATUS.CANCELLED,
  QUEUED: JOB_STATUS.PENDING,
  STARTED: JOB_STATUS.RUNNING,
  ERROR: JOB_STATUS.FAILED,
};

export function normalizeJobStatus(value?: string | null): JobStatusStatus | null {
  if (!value) return null;
  return LEGACY_STATUS_MAP[value] ?? LEGACY_STATUS_MAP[value.toLowerCase()] ?? null;
}

export function isTerminalJobStatus(status?: JobStatusStatus | null): boolean {
  return status === JOB_STATUS.COMPLETED ||
    status === JOB_STATUS.FAILED ||
    status === JOB_STATUS.CANCELLED;
}
