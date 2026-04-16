import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { generationJobArtifacts } from '@/db/schema';
import type { GenerationJobArtifact, NewGenerationJobArtifact } from '@/db/schema';
import type { BaseRepository, FindOptions } from '../base';

export class DrizzleGenerationJobArtifactRepository
  implements BaseRepository<GenerationJobArtifact, NewGenerationJobArtifact>
{
  async findAll(_options?: FindOptions): Promise<GenerationJobArtifact[]> {
    return db!.select().from(generationJobArtifacts);
  }

  async findById(id: number): Promise<GenerationJobArtifact | null> {
    const [row] = await db!
      .select()
      .from(generationJobArtifacts)
      .where(eq(generationJobArtifacts.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByJobId(jobId: number): Promise<GenerationJobArtifact[]> {
    return db!.select().from(generationJobArtifacts).where(eq(generationJobArtifacts.jobId, jobId));
  }

  async findOne(options: FindOptions): Promise<GenerationJobArtifact | null> {
    const all = await this.findAll(options);
    if (!options.where) return all[0] ?? null;
    return all.find((r) =>
      Object.entries(options.where!).every(([k, v]) => (r as Record<string, unknown>)[k] === v)
    ) ?? null;
  }

  async create(data: NewGenerationJobArtifact): Promise<GenerationJobArtifact> {
    const [row] = await db!.insert(generationJobArtifacts).values(data).returning();
    return row;
  }

  async update(
    id: number,
    data: Partial<GenerationJobArtifact>,
  ): Promise<GenerationJobArtifact | null> {
    const [row] = await db!
      .update(generationJobArtifacts)
      .set(data)
      .where(eq(generationJobArtifacts.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: number): Promise<boolean> {
    await db!.delete(generationJobArtifacts).where(eq(generationJobArtifacts.id, id));
    return true;
  }

  async deleteByJobId(jobId: number): Promise<void> {
    await db!.delete(generationJobArtifacts).where(eq(generationJobArtifacts.jobId, jobId));
  }
}
