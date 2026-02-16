export class PlanStartedEvent {
  constructor(
    public readonly jobId: string,
    public readonly userId: string,
    public readonly graphId: string,
    public readonly planningType: string
  ) {}
}

export class PlanProgressEvent {
  constructor(
    public readonly jobId: string,
    public readonly step: string,
    public readonly progress: number,
    public readonly message: string
  ) {}
}

export class PlanCompletedEvent {
  constructor(
    public readonly jobId: string,
    public readonly plan: any,
    public readonly processingTime: number
  ) {}
}

export class PlanFailedEvent {
  constructor(
    public readonly jobId: string,
    public readonly error: string
  ) {}
}
