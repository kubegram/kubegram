import type { EventCache } from '@kubegram/events';
import { EntityRecord } from '@/db/entity-record';
import { IdGenerator } from '@/db/id-generator';
import type { GenerationJobArtifact, NewGenerationJobArtifact } from '@/db/schema';
import type { FindOptions } from '../base';
import type { GenerationJobArtifactRepository } from '../index';

const TYPE = 'artifact';
const EVENT_TYPE = `kubegram.entity.${TYPE}`;

function key(id: number): string {
  return `${TYPE}:${id}`;
}

export class CacheGenerationJobArtifactRepository implements GenerationJobArtifactRepository {
  constructor(private readonly cache: EventCache) {}

  async findAll(_options?: FindOptions): Promise<GenerationJobArtifact[]> {
    const events = await this.cache.getEvents({ eventType: EVENT_TYPE });
    return events.map((e) => e.data as GenerationJobArtifact);
  }

  async findById(id: number): Promise<GenerationJobArtifact | null> {
    const event = await this.cache.get(key(id));
    return event ? (event.data as GenerationJobArtifact) : null;
  }

  async findOne(options: FindOptions): Promise<GenerationJobArtifact | null> {
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

  async create(data: NewGenerationJobArtifact): Promise<GenerationJobArtifact> {
    const id = data.id ?? IdGenerator.nextId(TYPE);
    const now = new Date();
    const record: GenerationJobArtifact = {
      id,
      jobId: data.jobId,
      type: data.type,
      name: data.name,
      content: data.content ?? null,
      storageUrl: data.storageUrl ?? null,
      size: data.size ?? null,
      checksum: data.checksum ?? null,
      createdAt: data.createdAt ?? now,
    };
    await this.cache.add(
      new EntityRecord(TYPE, key(id), record as Record<string, unknown>, `job:${data.jobId}`),
    );
    return record;
  }

  async update(id: number, data: Partial<GenerationJobArtifact>): Promise<GenerationJobArtifact | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: GenerationJobArtifact = { ...existing, ...data };
    await this.cache.add(
      new EntityRecord(TYPE, key(id), updated as Record<string, unknown>, `job:${existing.jobId}`),
    );
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    return this.cache.remove(key(id));
  }

  async findByJobId(jobId: number): Promise<GenerationJobArtifact[]> {
    const all = await this.findAll();
    return all.filter((a) => a.jobId === jobId);
  }

  async deleteByJobId(jobId: number): Promise<void> {
    const artifacts = await this.findByJobId(jobId);
    await Promise.all(artifacts.map((a) => this.delete(a.id)));
  }
}