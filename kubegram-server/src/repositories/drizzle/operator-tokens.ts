import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { operatorTokens } from '@/db/schema';
import type { OperatorToken, NewOperatorToken } from '@/db/schema';
import type { BaseRepository, FindOptions } from '../base';

export class DrizzleOperatorTokenRepository
  implements BaseRepository<OperatorToken, NewOperatorToken>
{
  async findAll(_options?: FindOptions): Promise<OperatorToken[]> {
    return db!.select().from(operatorTokens);
  }

  async findById(id: number): Promise<OperatorToken | null> {
    const [row] = await db!
      .select()
      .from(operatorTokens)
      .where(eq(operatorTokens.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByToken(token: string): Promise<OperatorToken | null> {
    const [row] = await db!
      .select()
      .from(operatorTokens)
      .where(eq(operatorTokens.token, token))
      .limit(1);
    return row ?? null;
  }

  async findByCompanyId(companyId: string): Promise<OperatorToken[]> {
    return db!.select().from(operatorTokens).where(eq(operatorTokens.companyId, companyId));
  }

  async findOne(options: FindOptions): Promise<OperatorToken | null> {
    const all = await this.findAll(options);
    if (!options.where) return all[0] ?? null;
    return all.find((r) =>
      Object.entries(options.where!).every(([k, v]) => (r as Record<string, unknown>)[k] === v)
    ) ?? null;
  }

  async create(data: NewOperatorToken): Promise<OperatorToken> {
    const [row] = await db!.insert(operatorTokens).values(data).returning();
    return row;
  }

  async update(id: number, data: Partial<OperatorToken>): Promise<OperatorToken | null> {
    const [row] = await db!
      .update(operatorTokens)
      .set(data)
      .where(eq(operatorTokens.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: number): Promise<boolean> {
    await db!.delete(operatorTokens).where(eq(operatorTokens.id, id));
    return true;
  }
}
