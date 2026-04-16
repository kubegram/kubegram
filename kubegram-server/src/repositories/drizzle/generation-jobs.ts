import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { generationJobs } from '@/db/schema';
import type { GenerationJob, NewGenerationJob } from '@/db/schema';
import type { BaseRepository, FindOptions } from '../base';

export class DrizzleGenerationJobRepository
  implements BaseRepository<GenerationJob, NewGenerationJob>
{
  async findAll(_options?: FindOptions): Promise<GenerationJob[]> {
    return db!.select().from(generationJobs).orderBy(desc(generationJobs.createdAt));
  }

  async findById(id: number): Promise<GenerationJob | null> {
    const [row] = await db!
      .select()
      .from(generationJobs)
      .where(eq(generationJobs.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByUuid(uuid: string): Promise<GenerationJob | null> {
    const [row] = await db!
      .select()
      .from(generationJobs)
      .where(eq(generationJobs.uuid, uuid))
      .limit(1);
    return row ?? null;
  }

  async findByProjectIds(projectIds: number[]): Promise<GenerationJob[]> {
    if (projectIds.length === 0) return [];
    return db!
      .select()
      .from(generationJobs)
      .where(inArray(generationJobs.projectId, projectIds))
      .orderBy(desc(generationJobs.createdAt));
  }

  async findOne(options: FindOptions): Promise<GenerationJob | null> {
    const all = await this.findAll(options);
    if (!options.where) return all[0] ?? null;
    return all.find((r) =>
      Object.entries(options.where!).every(([k, v]) => (r as Record<string, unknown>)[k] === v)
    ) ?? null;
  }

  async create(data: NewGenerationJob): Promise<GenerationJob> {
    const [row] = await db!.insert(generationJobs).values(data).returning();
    return row;
  }

  async update(id: number, data: Partial<GenerationJob>): Promise<GenerationJob | null> {
    const [row] = await db!
      .update(generationJobs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(generationJobs.id, id))
      .returning();
    return row ?? null;
  }

  async updateByUuid(
    uuid: string,
    data: Partial<GenerationJob>,
  ): Promise<GenerationJob | null> {
    const [row] = await db!
      .update(generationJobs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(generationJobs.uuid, uuid))
      .returning();
    return row ?? null;
  }

  async delete(id: number): Promise<boolean> {
    await db!.delete(generationJobs).where(eq(generationJobs.id, id));
    return true;
  }
}
