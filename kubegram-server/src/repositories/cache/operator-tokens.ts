import type { EventCache } from '@kubegram/events';
import { EntityRecord } from '@/db/entity-record';
import { IdGenerator } from '@/db/id-generator';
import type { OperatorToken, NewOperatorToken } from '@/db/schema';
import type { FindOptions } from '../base';
import type { OperatorTokenRepository } from '../index';

const TYPE = 'operatortoken';
const EVENT_TYPE = `kubegram.entity.${TYPE}`;

function key(id: number): string {
  return `${TYPE}:${id}`;
}

export class CacheOperatorTokenRepository implements OperatorTokenRepository {
  constructor(private readonly cache: EventCache) {}

  async findAll(_options?: FindOptions): Promise<OperatorToken[]> {
    const events = await this.cache.getEvents({ eventType: EVENT_TYPE });
    return events.map((e) => e.data as OperatorToken);
  }

  async findById(id: number): Promise<OperatorToken | null> {
    const event = await this.cache.get(key(id));
    return event ? (event.data as OperatorToken) : null;
  }

  async findOne(options: FindOptions): Promise<OperatorToken | null> {
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

  async create(data: NewOperatorToken): Promise<OperatorToken> {
    const existing = await this.findOne({ where: { token: data.token } });
    if (existing) {
      throw new Error(`Operator token ${data.token} already exists`);
    }
    const id = data.id ?? IdGenerator.nextId(TYPE);
    const now = new Date();
    const record: OperatorToken = {
      id,
      token: data.token,
      companyId: data.companyId ?? null,
      clusterId: data.clusterId ?? null,
      label: data.label ?? null,
      createdAt: data.createdAt ?? now,
      expiresAt: data.expiresAt ?? null,
      revokedAt: data.revokedAt ?? null,
    } as OperatorToken;
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

  async update(id: number, data: Partial<OperatorToken>): Promise<OperatorToken | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: OperatorToken = { ...existing, ...data };
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

  async findByToken(token: string): Promise<OperatorToken | null> {
    const all = await this.findAll();
    return all.find((t) => t.token === token && !t.revokedAt) ?? null;
  }

  async findByCompanyId(companyId: string): Promise<OperatorToken[]> {
    const all = await this.findAll();
    return all.filter((t) => t.companyId === companyId);
  }
}