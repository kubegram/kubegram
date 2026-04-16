import type { EventCache } from '@kubegram/events';
import { EntityRecord } from '@/db/entity-record';
import { IdGenerator } from '@/db/id-generator';
import type { User, NewUser } from '@/db/schema';
import type { FindOptions } from '../base';
import type { UserRepository } from '../index';

const TYPE = 'user';
const EVENT_TYPE = `kubegram.entity.${TYPE}`;

function key(id: number): string {
  return `${TYPE}:${id}`;
}

export class CacheUserRepository implements UserRepository {
  constructor(private readonly cache: EventCache) {}

  async findAll(_options?: FindOptions): Promise<User[]> {
    const events = await this.cache.getEvents({ eventType: EVENT_TYPE });
    return events.map((e) => e.data as User);
  }

  async findById(id: number): Promise<User | null> {
    const event = await this.cache.get(key(id));
    return event ? (event.data as User) : null;
  }

  async findOne(options: FindOptions): Promise<User | null> {
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

  async create(data: NewUser): Promise<User> {
    const existing = await this.findOne({ where: { email: data.email } });
    if (existing) {
      throw new Error(`User with email ${data.email} already exists`);
    }
    const id = data.id ?? IdGenerator.nextId(TYPE);
    const now = new Date();
    const record: User = {
      id,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl ?? null,
      role: data.role ?? 'team_member',
      provider: data.provider ?? null,
      providerId: data.providerId ?? null,
      teamId: data.teamId ?? null,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
      deletedAt: data.deletedAt ?? null,
    } as User;
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

  async update(id: number, data: Partial<User>): Promise<User | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: User = { ...existing, ...data, updatedAt: new Date() };
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
}