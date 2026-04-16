export interface FindOptions {
  where?: Record<string, unknown>;
  limit?: number;
  offset?: number;
}

export interface BaseRepository<T, NewT = Partial<T>> {
  findAll(options?: FindOptions): Promise<T[]>;
  findById(id: string | number): Promise<T | null>;
  findOne(options: FindOptions): Promise<T | null>;
  create(data: NewT): Promise<T>;
  update(id: string | number, data: Partial<T>): Promise<T | null>;
  delete(id: string | number): Promise<boolean>;
}
