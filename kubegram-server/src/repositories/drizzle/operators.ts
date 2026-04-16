import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { operators } from '@/db/schema';
import type { Operator, NewOperator } from '@/db/schema';
import type { BaseRepository, FindOptions } from '../base';

export class DrizzleOperatorRepository implements BaseRepository<Operator, NewOperator> {
  async findAll(_options?: FindOptions): Promise<Operator[]> {
    return db!.select().from(operators);
  }

  async findById(id: number): Promise<Operator | null> {
    const [row] = await db!.select().from(operators).where(eq(operators.id, id)).limit(1);
    return row ?? null;
  }

  async findByClusterId(clusterId: string): Promise<Operator | null> {
    const [row] = await db!
      .select()
      .from(operators)
      .where(eq(operators.clusterId, clusterId))
      .limit(1);
    return row ?? null;
  }

  async findByCompanyId(companyId: string): Promise<Operator[]> {
    return db!.select().from(operators).where(eq(operators.companyId, companyId));
  }

  async findOne(options: FindOptions): Promise<Operator | null> {
    const all = await this.findAll(options);
    if (!options.where) return all[0] ?? null;
    return all.find((r) =>
      Object.entries(options.where!).every(([k, v]) => (r as Record<string, unknown>)[k] === v)
    ) ?? null;
  }

  async create(data: NewOperator): Promise<Operator> {
    const [row] = await db!.insert(operators).values(data).returning();
    return row;
  }

  async update(id: number, data: Partial<Operator>): Promise<Operator | null> {
    const [row] = await db!
      .update(operators)
      .set(data)
      .where(eq(operators.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: number): Promise<boolean> {
    await db!.delete(operators).where(eq(operators.id, id));
    return true;
  }
}
