import type { EventCache } from '@kubegram/events';
import { EntityRecord } from '@/db/entity-record';
import { IdGenerator } from '@/db/id-generator';
import type { CompanyCertificate, NewCompanyCertificate } from '@/db/schema';
import type { BaseRepository, FindOptions } from '../base';
import type { CompanyCertificateRepository } from '../index';

const TYPE = 'certificate';
const EVENT_TYPE = `kubegram.entity.${TYPE}`;

function key(id: number): string {
  return `${TYPE}:${id}`;
}

export class CacheCompanyCertificateRepository implements CompanyCertificateRepository {
  constructor(private readonly cache: EventCache) {}

  async findAll(_options?: FindOptions): Promise<CompanyCertificate[]> {
    const events = await this.cache.getEvents({ eventType: EVENT_TYPE });
    return events.map((e) => e.data as CompanyCertificate);
  }

  async findById(id: number): Promise<CompanyCertificate | null> {
    const event = await this.cache.get(key(id));
    return event ? (event.data as CompanyCertificate) : null;
  }

  async findOne(options: FindOptions): Promise<CompanyCertificate | null> {
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

  async create(data: NewCompanyCertificate): Promise<CompanyCertificate> {
    const id = data.id ?? IdGenerator.nextId(TYPE);
    const now = new Date();
    const record: CompanyCertificate = {
      id,
      companyId: data.companyId ?? null,
      publicKeyUrl: data.publicKeyUrl,
      encryptedPrivateKey: data.encryptedPrivateKey ?? null,
      fingerprint: data.fingerprint,
      label: data.label ?? null,
      createdAt: data.createdAt ?? now,
      invalidatedAt: data.invalidatedAt ?? null,
    } as CompanyCertificate;
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

  async update(id: number, data: Partial<CompanyCertificate>): Promise<CompanyCertificate | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: CompanyCertificate = { ...existing, ...data };
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

  async findByCompanyId(companyId: string): Promise<CompanyCertificate[]> {
    const all = await this.findAll();
    return all.filter((c) => c.companyId === companyId);
  }
}