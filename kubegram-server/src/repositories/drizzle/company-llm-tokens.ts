import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { companyLlmTokens } from '@/db/schema';
import type { CompanyLlmToken, NewCompanyLlmToken } from '@/db/schema';
import type { BaseRepository, FindOptions } from '../base';

export class DrizzleCompanyLlmTokenRepository
  implements BaseRepository<CompanyLlmToken, NewCompanyLlmToken>
{
  async findAll(_options?: FindOptions): Promise<CompanyLlmToken[]> {
    return db!.select().from(companyLlmTokens);
  }

  async findById(id: number): Promise<CompanyLlmToken | null> {
    const [row] = await db!
      .select()
      .from(companyLlmTokens)
      .where(eq(companyLlmTokens.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByCompanyId(companyId: string): Promise<CompanyLlmToken[]> {
    return db!.select().from(companyLlmTokens).where(eq(companyLlmTokens.companyId, companyId));
  }

  async findOne(options: FindOptions): Promise<CompanyLlmToken | null> {
    const all = await this.findAll(options);
    if (!options.where) return all[0] ?? null;
    return all.find((r) =>
      Object.entries(options.where!).every(([k, v]) => (r as Record<string, unknown>)[k] === v)
    ) ?? null;
  }

  async create(data: NewCompanyLlmToken): Promise<CompanyLlmToken> {
    const [row] = await db!.insert(companyLlmTokens).values(data).returning();
    return row;
  }

  async update(id: number, data: Partial<CompanyLlmToken>): Promise<CompanyLlmToken | null> {
    const [row] = await db!
      .update(companyLlmTokens)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companyLlmTokens.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: number): Promise<boolean> {
    await db!.delete(companyLlmTokens).where(eq(companyLlmTokens.id, id));
    return true;
  }
}
