import type { EventCache } from '@kubegram/events';
import { EntityRecord } from '@/db/entity-record';
import type { Company, NewCompany } from '@/db/schema';
import type { BaseRepository, FindOptions } from '../base';
import type { CompanyRepository } from '../index';

const TYPE = 'company';
const EVENT_TYPE = `kubegram.entity.${TYPE}`;

function key(id: string): string {
  return `${TYPE}:${id}`;
}

export class CacheCompanyRepository implements CompanyRepository {
  constructor(private readonly cache: EventCache) {}

  async findAll(_options?: FindOptions): Promise<Company[]> {
    const events = await this.cache.getEvents({ eventType: EVENT_TYPE });
    return events.map((e) => e.data as Company);
  }

  async findById(id: string): Promise<Company | null> {
    const event = await this.cache.get(key(id));
    return event ? (event.data as Company) : null;
  }

  async findOne(options: FindOptions): Promise<Company | null> {
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

  async create(data: NewCompany): Promise<Company> {
    const id = data.id ?? crypto.randomUUID();
    const now = new Date();
    const record: Company = {
      id,
      name: data.name,
      tokens: data.tokens ?? 0,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
      deletedAt: data.deletedAt ?? null,
    };
    await this.cache.add(new EntityRecord(TYPE, key(id), record as Record<string, unknown>));
    return record;
  }

  async update(id: string, data: Partial<Company>): Promise<Company | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: Company = { ...existing, ...data, updatedAt: new Date() };
    await this.cache.add(new EntityRecord(TYPE, key(id), updated as Record<string, unknown>));
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.cache.remove(key(id));
  }
}
