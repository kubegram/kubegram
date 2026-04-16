import type { EventCache } from '@kubegram/events';
import { EntityRecord } from '@/db/entity-record';
import { IdGenerator } from '@/db/id-generator';
import type { Project, NewProject } from '@/db/schema';
import type { FindOptions } from '../base';
import type { ProjectRepository } from '../index';

const TYPE = 'project';
const EVENT_TYPE = `kubegram.entity.${TYPE}`;

function key(id: number): string {
  return `${TYPE}:${id}`;
}

export class CacheProjectRepository implements ProjectRepository {
  constructor(private readonly cache: EventCache) {}

  async findAll(_options?: FindOptions): Promise<Project[]> {
    const events = await this.cache.getEvents({ eventType: EVENT_TYPE });
    return events.map((e) => e.data as Project);
  }

  async findById(id: number): Promise<Project | null> {
    const event = await this.cache.get(key(id));
    return event ? (event.data as Project) : null;
  }

  async findOne(options: FindOptions): Promise<Project | null> {
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

  async create(data: NewProject): Promise<Project> {
    const id = data.id ?? IdGenerator.nextId(TYPE);
    const now = new Date();
    const record: Project = {
      id,
      name: data.name,
      graphId: data.graphId ?? null,
      graphMeta: data.graphMeta ?? null,
      teamId: data.teamId ?? null,
      createdBy: data.createdBy ?? null,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
      deletedAt: data.deletedAt ?? null,
      githubInstallationId: data.githubInstallationId ?? null,
      githubOwner: data.githubOwner ?? null,
      githubRepo: data.githubRepo ?? null,
      githubBaseBranch: data.githubBaseBranch ?? 'main',
      argocdAppName: data.argocdAppName ?? null,
    };
    await this.cache.add(
      new EntityRecord(
        TYPE,
        key(id),
        record as Record<string, unknown>,
        data.teamId ? `team:${data.teamId}` : undefined,
      ),
    );
    return record;
  }

  async update(id: number, data: Partial<Project>): Promise<Project | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: Project = { ...existing, ...data, updatedAt: new Date() };
    await this.cache.add(
      new EntityRecord(
        TYPE,
        key(id),
        updated as Record<string, unknown>,
        existing.teamId ? `team:${existing.teamId}` : undefined,
      ),
    );
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    return this.cache.remove(key(id));
  }

  async findActiveByTeam(teamId: number): Promise<Project[]> {
    const all = await this.findAll();
    return all.filter((p) => p.teamId === teamId && !p.deletedAt);
  }

  async softDelete(id: number): Promise<Project | null> {
    return this.update(id, { deletedAt: new Date() });
  }
}