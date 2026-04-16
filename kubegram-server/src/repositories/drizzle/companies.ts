import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { companies } from '@/db/schema';
import type { Company, NewCompany } from '@/db/schema';
import type { BaseRepository, FindOptions } from '../base';

export class DrizzleCompanyRepository implements BaseRepository<Company, NewCompany> {
  async findAll(_options?: FindOptions): Promise<Company[]> {
    return db!.select().from(companies);
  }

  async findById(id: string): Promise<Company | null> {
    const [row] = await db!.select().from(companies).where(eq(companies.id, id)).limit(1);
    return row ?? null;
  }

  async findOne(options: FindOptions): Promise<Company | null> {
    const all = await this.findAll(options);
    if (!options.where) return all[0] ?? null;
    return all.find((r) =>
      Object.entries(options.where!).every(([k, v]) => (r as Record<string, unknown>)[k] === v)
    ) ?? null;
  }

  async create(data: NewCompany): Promise<Company> {
    const [row] = await db!.insert(companies).values(data).returning();
    return row;
  }

  async update(id: string, data: Partial<Company>): Promise<Company | null> {
    const [row] = await db!
      .update(companies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: string): Promise<boolean> {
    await db!.delete(companies).where(eq(companies.id, id));
    return true;
  }
}
