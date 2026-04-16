import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import type { User, NewUser } from '@/db/schema';
import type { BaseRepository, FindOptions } from '../base';

export class DrizzleUserRepository implements BaseRepository<User, NewUser> {
  async findAll(_options?: FindOptions): Promise<User[]> {
    return db!.select().from(users);
  }

  async findById(id: number): Promise<User | null> {
    const [row] = await db!.select().from(users).where(eq(users.id, id)).limit(1);
    return row ?? null;
  }

  async findOne(options: FindOptions): Promise<User | null> {
    const all = await this.findAll(options);
    if (!options.where) return all[0] ?? null;
    return all.find((r) =>
      Object.entries(options.where!).every(([k, v]) => (r as Record<string, unknown>)[k] === v)
    ) ?? null;
  }

  async create(data: NewUser): Promise<User> {
    const [row] = await db!.insert(users).values(data).returning();
    return row;
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    const [row] = await db!
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: number): Promise<boolean> {
    await db!.delete(users).where(eq(users.id, id));
    return true;
  }
}
