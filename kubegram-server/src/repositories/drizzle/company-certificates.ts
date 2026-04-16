import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { companyCertificates } from '@/db/schema';
import type { CompanyCertificate, NewCompanyCertificate } from '@/db/schema';
import type { BaseRepository, FindOptions } from '../base';

export class DrizzleCompanyCertificateRepository
  implements BaseRepository<CompanyCertificate, NewCompanyCertificate>
{
  async findAll(_options?: FindOptions): Promise<CompanyCertificate[]> {
    return db!.select().from(companyCertificates);
  }

  async findById(id: number): Promise<CompanyCertificate | null> {
    const [row] = await db!
      .select()
      .from(companyCertificates)
      .where(eq(companyCertificates.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByCompanyId(companyId: string): Promise<CompanyCertificate[]> {
    return db!
      .select()
      .from(companyCertificates)
      .where(eq(companyCertificates.companyId, companyId));
  }

  async findOne(options: FindOptions): Promise<CompanyCertificate | null> {
    const all = await this.findAll(options);
    if (!options.where) return all[0] ?? null;
    return all.find((r) =>
      Object.entries(options.where!).every(([k, v]) => (r as Record<string, unknown>)[k] === v)
    ) ?? null;
  }

  async create(data: NewCompanyCertificate): Promise<CompanyCertificate> {
    const [row] = await db!.insert(companyCertificates).values(data).returning();
    return row;
  }

  async update(
    id: number,
    data: Partial<CompanyCertificate>,
  ): Promise<CompanyCertificate | null> {
    const [row] = await db!
      .update(companyCertificates)
      .set(data)
      .where(eq(companyCertificates.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: number): Promise<boolean> {
    await db!.delete(companyCertificates).where(eq(companyCertificates.id, id));
    return true;
  }
}
