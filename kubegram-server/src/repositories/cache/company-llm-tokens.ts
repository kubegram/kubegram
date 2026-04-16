import type { EventCache } from '@kubegram/events';
import { EntityRecord } from '@/db/entity-record';
import { IdGenerator } from '@/db/id-generator';
import type { CompanyLlmToken, NewCompanyLlmToken } from '@/db/schema';
import type { BaseRepository, FindOptions } from '../base';
import type { CompanyLlmTokenRepository } from '../index';

const TYPE = 'llmtoken';
const EVENT_TYPE = `kubegram.entity.${TYPE}`;

function key(id: number): string {
  return `${TYPE}:${id}`;
}

export class CacheCompanyLlmTokenRepository implements CompanyLlmTokenRepository {
  constructor(private readonly cache: EventCache) {}

  async findAll(_options?: FindOptions): Promise<CompanyLlmToken[]> {
    const events = await this.cache.getEvents({ eventType: EVENT_TYPE });
    return events.map((e) => e.data as CompanyLlmToken);
  }

  async findById(id: number): Promise<CompanyLlmToken | null> {
    const event = await this.cache.get(key(id));
    return event ? (event.data as CompanyLlmToken) : null;
  }

  async findOne(options: FindOptions): Promise<CompanyLlmToken | null> {
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

  async create(data: NewCompanyLlmToken): Promise<CompanyLlmToken> {
    const id = data.id ?? IdGenerator.nextId(TYPE);
    const now = new Date();
    const record: CompanyLlmToken = {
      id,
      companyId: data.companyId ?? null,
      provider: data.provider,
      providerAPIUrl: data.providerAPIUrl ?? null,
      encryptedTokenUrl: data.encryptedTokenUrl ?? null,
      models: data.models ?? null,
      encryptionKeyId: data.encryptionKeyId ?? null,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    } as CompanyLlmToken;
    await this.cache.add(
      new EntityRecord(
        TYPE,
        key(id),
        record as Record<string, unknown>,
        data.companyId ? `company:${data.companyId}` : undefined,
      ),
    );
    return record;
  }

  async update(id: number, data: Partial<CompanyLlmToken>): Promise<CompanyLlmToken | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: CompanyLlmToken = { ...existing, ...data, updatedAt: new Date() };
    await this.cache.add(
      new EntityRecord(
        TYPE,
        key(id),
        updated as Record<string, unknown>,
        existing.companyId ? `company:${existing.companyId}` : undefined,
      ),
    );
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    return this.cache.remove(key(id));
  }

  async findByCompanyId(companyId: string): Promise<CompanyLlmToken[]> {
    const all = await this.findAll();
    return all.filter((t) => t.companyId === companyId);
  }
}