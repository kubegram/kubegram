export class CodegenStartedEvent {
  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly graphId: string,
    public readonly graphData: any,
    public readonly options: any
  ) {}
}

export class CodegenProgressEvent {
  constructor(
    public readonly jobId: string,
    public readonly step: string,
    public readonly progress: number,
    public readonly message: string
  ) {}
}

export class CodegenCompletedEvent {
  constructor(
    public readonly jobId: string,
    public readonly manifests: any[],
    public readonly graphId: string,
    public readonly processingTime: number
  ) {}
}

export class CodegenFailedEvent {
  constructor(
    public readonly jobId: string,
    public readonly error: string,
    public readonly step?: string,
    public readonly retryable?: boolean
  ) {}
}
