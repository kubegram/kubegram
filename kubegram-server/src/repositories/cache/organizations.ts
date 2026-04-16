import type { EventCache } from '@kubegram/events';
import { EntityRecord } from '@/db/entity-record';
import { IdGenerator } from '@/db/id-generator';
import type { Organization, NewOrganization } from '@/db/schema';
import type { FindOptions } from '../base';
import type { OrganizationRepository } from '../index';

const TYPE = 'organization';
const EVENT_TYPE = `kubegram.entity.${TYPE}`;

function key(id: number): string {
  return `${TYPE}:${id}`;
}

export class CacheOrganizationRepository implements OrganizationRepository {
  constructor(private readonly cache: EventCache) {}

  async findAll(_options?: FindOptions): Promise<Organization[]> {
    const events = await this.cache.getEvents({ eventType: EVENT_TYPE });
    return events.map((e) => e.data as Organization);
  }

  async findById(id: number): Promise<Organization | null> {
    const event = await this.cache.get(key(id));
    return event ? (event.data as Organization) : null;
  }

  async findOne(options: FindOptions): Promise<Organization | null> {
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

  async create(data: NewOrganization): Promise<Organization> {
    const id = data.id ?? IdGenerator.nextId(TYPE);
    const now = new Date();
    const record: Organization = {
      id,
      name: data.name,
      companyId: data.companyId ?? null,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
      deletedAt: data.deletedAt ?? null,
    };
    await this.cache.add(
      new EntityRecord(TYPE, key(id), record as Record<string, unknown>, data.companyId ? `company:${data.companyId}` : undefined),
    );
    return record;
  }

  async update(id: number, data: Partial<Organization>): Promise<Organization | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: Organization = { ...existing, ...data, updatedAt: new Date() };
    await this.cache.add(
      new EntityRecord(TYPE, key(id), updated as Record<string, unknown>, existing.companyId ? `company:${existing.companyId}` : undefined),
    );
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    return this.cache.remove(key(id));
  }
}