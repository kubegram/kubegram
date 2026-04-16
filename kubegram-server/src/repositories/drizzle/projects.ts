import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { projects } from '@/db/schema';
import type { Project, NewProject } from '@/db/schema';
import type { BaseRepository, FindOptions } from '../base';

export class DrizzleProjectRepository implements BaseRepository<Project, NewProject> {
  async findAll(options?: FindOptions): Promise<Project[]> {
    const query = db!.select().from(projects);
    if (options?.limit) {
      return query.limit(options.limit);
    }
    return query;
  }

  /** Returns non-deleted projects for a team, newest first */
  async findActiveByTeam(teamId: number): Promise<Project[]> {
    return db!
      .select()
      .from(projects)
      .where(and(eq(projects.teamId, teamId), isNull(projects.deletedAt)))
      .orderBy(desc(projects.createdAt));
  }

  async findById(id: number): Promise<Project | null> {
    const [row] = await db!.select().from(projects).where(eq(projects.id, id)).limit(1);
    return row ?? null;
  }

  async findOne(options: FindOptions): Promise<Project | null> {
    const all = await this.findAll(options);
    if (!options.where) return all[0] ?? null;
    return all.find((r) =>
      Object.entries(options.where!).every(([k, v]) => (r as Record<string, unknown>)[k] === v)
    ) ?? null;
  }

  async create(data: NewProject): Promise<Project> {
    const [row] = await db!.insert(projects).values(data).returning();
    return row;
  }

  async update(id: number, data: Partial<Project>): Promise<Project | null> {
    const [row] = await db!
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: number): Promise<boolean> {
    await db!.delete(projects).where(eq(projects.id, id));
    return true;
  }

  async softDelete(id: number): Promise<Project | null> {
    return this.update(id, { deletedAt: new Date() });
  }
}
