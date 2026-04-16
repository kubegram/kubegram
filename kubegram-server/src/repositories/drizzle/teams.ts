import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { teams } from '@/db/schema';
import type { Team, NewTeam } from '@/db/schema';
import type { BaseRepository, FindOptions } from '../base';

export class DrizzleTeamRepository implements BaseRepository<Team, NewTeam> {
  async findAll(_options?: FindOptions): Promise<Team[]> {
    return db!.select().from(teams);
  }

  async findById(id: number): Promise<Team | null> {
    const [row] = await db!.select().from(teams).where(eq(teams.id, id)).limit(1);
    return row ?? null;
  }

  async findOne(options: FindOptions): Promise<Team | null> {
    const all = await this.findAll(options);
    if (!options.where) return all[0] ?? null;
    return all.find((r) =>
      Object.entries(options.where!).every(([k, v]) => (r as Record<string, unknown>)[k] === v)
    ) ?? null;
  }

  async create(data: NewTeam): Promise<Team> {
    const [row] = await db!.insert(teams).values(data).returning();
    return row;
  }

  async update(id: number, data: Partial<Team>): Promise<Team | null> {
    const [row] = await db!
      .update(teams)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: number): Promise<boolean> {
    await db!.delete(teams).where(eq(teams.id, id));
    return true;
  }
}
