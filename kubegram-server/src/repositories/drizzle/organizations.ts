import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { organizations } from '@/db/schema';
import type { Organization, NewOrganization } from '@/db/schema';
import type { BaseRepository, FindOptions } from '../base';

export class DrizzleOrganizationRepository
  implements BaseRepository<Organization, NewOrganization>
{
  async findAll(_options?: FindOptions): Promise<Organization[]> {
    return db!.select().from(organizations);
  }

  async findById(id: number): Promise<Organization | null> {
    const [row] = await db!.select().from(organizations).where(eq(organizations.id, id)).limit(1);
    return row ?? null;
  }

  async findOne(options: FindOptions): Promise<Organization | null> {
    const all = await this.findAll(options);
    if (!options.where) return all[0] ?? null;
    return all.find((r) =>
      Object.entries(options.where!).every(([k, v]) => (r as Record<string, unknown>)[k] === v)
    ) ?? null;
  }

  async create(data: NewOrganization): Promise<Organization> {
    const [row] = await db!.insert(organizations).values(data).returning();
    return row;
  }

  async update(id: number, data: Partial<Organization>): Promise<Organization | null> {
    const [row] = await db!
      .update(organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: number): Promise<boolean> {
    await db!.delete(organizations).where(eq(organizations.id, id));
    return true;
  }
}
