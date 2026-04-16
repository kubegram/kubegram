import type { EventCache } from '@kubegram/events';
import { EntityRecord } from '@/db/entity-record';
import { IdGenerator } from '@/db/id-generator';
import type { GenerationJob, NewGenerationJob } from '@/db/schema';
import type { FindOptions } from '../base';
import type { GenerationJobRepository } from '../index';
import type { GenerationJobArtifactRepository } from '../index';

const TYPE = 'generationjob';
const EVENT_TYPE = `kubegram.entity.${TYPE}`;

function key(id: number): string {
  return `${TYPE}:${id}`;
}

export class CacheGenerationJobRepository implements GenerationJobRepository {
  constructor(
    private readonly cache: EventCache,
    private readonly artifactRepo: GenerationJobArtifactRepository,
  ) {}

  async findAll(_options?: FindOptions): Promise<GenerationJob[]> {
    const events = await this.cache.getEvents({ eventType: EVENT_TYPE });
    return events.map((e) => e.data as GenerationJob);
  }

  async findById(id: number): Promise<GenerationJob | null> {
    const event = await this.cache.get(key(id));
    return event ? (event.data as GenerationJob) : null;
  }

  async findOne(options: FindOptions): Promise<GenerationJob | null> {
    const all = await this.findAll();
    if (!options.where) return all[0] ?? null;
    return (
      all.find((r) =>
        Object.entries(options.where!).every(
          ([k, v]) => (r as Record<string, unknown>)[k] === v,
        ),
      ) ?? null
    );
  }

  async create(data: NewGenerationJob): Promise<GenerationJob> {
    const id = data.id ?? IdGenerator.nextId(TYPE);
    const uuid = data.uuid ?? crypto.randomUUID();
    const now = new Date();
    const record: GenerationJob = {
      id,
      uuid,
      graphId: data.graphId,
      projectId: data.projectId,
      requestedBy: data.requestedBy,
      status: data.status ?? 'pending',
      config: data.config,
      resultData: data.resultData ?? null,
      errorMessage: data.errorMessage ?? null,
      progress: data.progress ?? 0,
      startedAt: data.startedAt ?? null,
      completedAt: data.completedAt ?? null,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
      githubPrUrl: data.githubPrUrl ?? null,
    };
    await this.cache.add(
      new EntityRecord(
        TYPE,
        key(id),
        record as Record<string, unknown>,
        `project:${data.projectId}`,
      ),
    );
    return record;
  }

  async update(id: number, data: Partial<GenerationJob>): Promise<GenerationJob | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: GenerationJob = { ...existing, ...data, updatedAt: new Date() };
    await this.cache.add(
      new EntityRecord(
        TYPE,
        key(id),
        updated as Record<string, unknown>,
        `project:${existing.projectId}`,
      ),
    );
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    await this.artifactRepo.deleteByJobId(id);
    return this.cache.remove(key(id));
  }

  async findByUuid(uuid: string): Promise<GenerationJob | null> {
    const all = await this.findAll();
    return all.find((j) => j.uuid === uuid) ?? null;
  }

  async findByProjectIds(projectIds: number[]): Promise<GenerationJob[]> {
    const all = await this.findAll();
    return all.filter((j) => projectIds.includes(j.projectId));
  }

  async updateByUuid(uuid: string, data: Partial<GenerationJob>): Promise<GenerationJob | null> {
    const job = await this.findByUuid(uuid);
    if (!job) return null;
    return this.update(job.id, data);
  }
}