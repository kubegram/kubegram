import type { EventCache } from '@kubegram/events';
import { EntityRecord } from '@/db/entity-record';
import { IdGenerator } from '@/db/id-generator';
import type { Operator, NewOperator } from '@/db/schema';
import type { BaseRepository, FindOptions } from '../base';
import type { OperatorRepository } from '../index';

const TYPE = 'operator';
const EVENT_TYPE = `kubegram.entity.${TYPE}`;

function key(id: number): string {
  return `${TYPE}:${id}`;
}

export class CacheOperatorRepository implements OperatorRepository {
  constructor(private readonly cache: EventCache) {}

  async findAll(_options?: FindOptions): Promise<Operator[]> {
    const events = await this.cache.getEvents({ eventType: EVENT_TYPE });
    return events.map((e) => e.data as Operator);
  }

  async findById(id: number): Promise<Operator | null> {
    const event = await this.cache.get(key(id));
    return event ? (event.data as Operator) : null;
  }

  async findOne(options: FindOptions): Promise<Operator | null> {
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

  async create(data: NewOperator): Promise<Operator> {
    const existingCluster = await this.findByClusterId(data.clusterId);
    if (existingCluster) {
      throw new Error(`Operator clusterId ${data.clusterId} already exists`);
    }
    const id = data.id ?? IdGenerator.nextId(TYPE);
    const now = new Date();
    const record: Operator = {
      id,
      clusterId: data.clusterId,
      tokenId: data.tokenId ?? null,
      companyId: data.companyId ?? null,
      version: data.version ?? null,
      mcpEndpoint: data.mcpEndpoint ?? null,
      status: data.status ?? 'online',
      lastSeenAt: data.lastSeenAt ?? now,
      registeredAt: data.registeredAt ?? now,
    } as Operator;
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

  async update(id: number, data: Partial<Operator>): Promise<Operator | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: Operator = { ...existing, ...data, lastSeenAt: new Date() };
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

  async findByClusterId(clusterId: string): Promise<Operator | null> {
    const all = await this.findAll();
    return all.find((o) => o.clusterId === clusterId) ?? null;
  }

  async findByCompanyId(companyId: string): Promise<Operator[]> {
    const all = await this.findAll();
    return all.filter((o) => o.companyId === companyId);
  }
}