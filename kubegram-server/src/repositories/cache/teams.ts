import type { EventCache } from '@kubegram/events';
import { EntityRecord } from '@/db/entity-record';
import { IdGenerator } from '@/db/id-generator';
import type { Team, NewTeam } from '@/db/schema';
import type { BaseRepository, FindOptions } from '../base';
import type { TeamRepository } from '../index';

const TYPE = 'team';
const EVENT_TYPE = `kubegram.entity.${TYPE}`;

function key(id: number): string {
  return `${TYPE}:${id}`;
}

export class CacheTeamRepository implements TeamRepository {
  constructor(private readonly cache: EventCache) {}

  async findAll(_options?: FindOptions): Promise<Team[]> {
    const events = await this.cache.getEvents({ eventType: EVENT_TYPE });
    return events.map((e) => e.data as Team);
  }

  async findById(id: number): Promise<Team | null> {
    const event = await this.cache.get(key(id));
    return event ? (event.data as Team) : null;
  }

  async findOne(options: FindOptions): Promise<Team | null> {
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

  async create(data: NewTeam): Promise<Team> {
    const id = data.id ?? IdGenerator.nextId(TYPE);
    const now = new Date();
    const record: Team = {
      id,
      name: data.name,
      organizationId: data.organizationId ?? null,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
      deletedAt: data.deletedAt ?? null,
    };
    await this.cache.add(
      new EntityRecord(
        TYPE,
        key(id),
        record as Record<string, unknown>,
        data.organizationId ? `organization:${data.organizationId}` : undefined,
      ),
    );
    return record;
  }

  async update(id: number, data: Partial<Team>): Promise<Team | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: Team = { ...existing, ...data, updatedAt: new Date() };
    await this.cache.add(
      new EntityRecord(
        TYPE,
        key(id),
        updated as Record<string, unknown>,
        existing.organizationId ? `organization:${existing.organizationId}` : undefined,
      ),
    );
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    return this.cache.remove(key(id));
  }
}