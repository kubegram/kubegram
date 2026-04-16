import type { BaseRepository } from './base';
import type {
  Company, NewCompany,
  Organization, NewOrganization,
  Team, NewTeam,
  User, NewUser,
  Project, NewProject,
  GenerationJob, NewGenerationJob,
  GenerationJobArtifact, NewGenerationJobArtifact,
  CompanyCertificate, NewCompanyCertificate,
  CompanyLlmToken, NewCompanyLlmToken,
  OperatorToken, NewOperatorToken,
  Operator, NewOperator,
} from '@/db/schema';

// Extended repository interfaces with entity-specific helpers
export interface CompanyRepository extends BaseRepository<Company, NewCompany> {}

export interface OrganizationRepository extends BaseRepository<Organization, NewOrganization> {}

export interface TeamRepository extends BaseRepository<Team, NewTeam> {}

export interface UserRepository extends BaseRepository<User, NewUser> {}

export interface ProjectRepository extends BaseRepository<Project, NewProject> {
  findActiveByTeam(teamId: number): Promise<Project[]>;
  softDelete(id: number): Promise<Project | null>;
}

export interface GenerationJobRepository extends BaseRepository<GenerationJob, NewGenerationJob> {
  findByUuid(uuid: string): Promise<GenerationJob | null>;
  findByProjectIds(projectIds: number[]): Promise<GenerationJob[]>;
  updateByUuid(uuid: string, data: Partial<GenerationJob>): Promise<GenerationJob | null>;
}

export interface GenerationJobArtifactRepository
  extends BaseRepository<GenerationJobArtifact, NewGenerationJobArtifact> {
  findByJobId(jobId: number): Promise<GenerationJobArtifact[]>;
  deleteByJobId(jobId: number): Promise<void>;
}

export interface CompanyCertificateRepository
  extends BaseRepository<CompanyCertificate, NewCompanyCertificate> {
  findByCompanyId(companyId: string): Promise<CompanyCertificate[]>;
}

export interface CompanyLlmTokenRepository
  extends BaseRepository<CompanyLlmToken, NewCompanyLlmToken> {
  findByCompanyId(companyId: string): Promise<CompanyLlmToken[]>;
}

export interface OperatorTokenRepository
  extends BaseRepository<OperatorToken, NewOperatorToken> {
  findByToken(token: string): Promise<OperatorToken | null>;
  findByCompanyId(companyId: string): Promise<OperatorToken[]>;
}

export interface OperatorRepository extends BaseRepository<Operator, NewOperator> {
  findByClusterId(clusterId: string): Promise<Operator | null>;
  findByCompanyId(companyId: string): Promise<Operator[]>;
}

export interface Repositories {
  companies: CompanyRepository;
  organizations: OrganizationRepository;
  teams: TeamRepository;
  users: UserRepository;
  projects: ProjectRepository;
  generationJobs: GenerationJobRepository;
  generationJobArtifacts: GenerationJobArtifactRepository;
  companyCertificates: CompanyCertificateRepository;
  companyLlmTokens: CompanyLlmTokenRepository;
  operatorTokens: OperatorTokenRepository;
  operators: OperatorRepository;
}

let _repositories: Repositories | null = null;

export function getRepositories(): Repositories {
  if (!_repositories) {
    throw new Error(
      'Repositories not initialized. Call initializeRepositories() at startup.',
    );
  }
  return _repositories;
}

async function buildDrizzleRepositories(): Promise<Repositories> {
  const { DrizzleCompanyRepository } = await import('./drizzle/companies');
  const { DrizzleOrganizationRepository } = await import('./drizzle/organizations');
  const { DrizzleTeamRepository } = await import('./drizzle/teams');
  const { DrizzleUserRepository } = await import('./drizzle/users');
  const { DrizzleProjectRepository } = await import('./drizzle/projects');
  const { DrizzleGenerationJobRepository } = await import('./drizzle/generation-jobs');
  const { DrizzleGenerationJobArtifactRepository } = await import(
    './drizzle/generation-job-artifacts'
  );
  const { DrizzleCompanyCertificateRepository } = await import('./drizzle/company-certificates');
  const { DrizzleCompanyLlmTokenRepository } = await import('./drizzle/company-llm-tokens');
  const { DrizzleOperatorTokenRepository } = await import('./drizzle/operator-tokens');
  const { DrizzleOperatorRepository } = await import('./drizzle/operators');

  return {
    companies: new DrizzleCompanyRepository(),
    organizations: new DrizzleOrganizationRepository(),
    teams: new DrizzleTeamRepository(),
    users: new DrizzleUserRepository(),
    projects: new DrizzleProjectRepository(),
    generationJobs: new DrizzleGenerationJobRepository(),
    generationJobArtifacts: new DrizzleGenerationJobArtifactRepository(),
    companyCertificates: new DrizzleCompanyCertificateRepository(),
    companyLlmTokens: new DrizzleCompanyLlmTokenRepository(),
    operatorTokens: new DrizzleOperatorTokenRepository(),
    operators: new DrizzleOperatorRepository(),
  };
}

async function buildCacheRepositories(): Promise<Repositories> {
  const { EventCache, StorageMode, RedisEventStorage } = await import('@kubegram/events');
  const config = (await import('@/config/env')).default;

  let cache: InstanceType<typeof EventCache>;

  if (config.enableHA) {
    // HA mode: persist entity data through Redis so it survives restarts
    const { redisClient } = await import('@/state/redis');
    const storage = new RedisEventStorage({
      redis: redisClient as any,
      keyPrefix: 'kubegram:entity:',
      eventTTL: 0, // no expiry for entity data
    });
    cache = new EventCache({ storage, mode: StorageMode.WRITE_THROUGH, maxSize: 10000 });
  } else {
    cache = new EventCache({ mode: StorageMode.MEMORY, maxSize: 10000 });
  }

  const { CacheCompanyRepository } = await import('./cache/companies');
  const { CacheOrganizationRepository } = await import('./cache/organizations');
  const { CacheTeamRepository } = await import('./cache/teams');
  const { CacheUserRepository } = await import('./cache/users');
  const { CacheProjectRepository } = await import('./cache/projects');
  const { CacheGenerationJobRepository } = await import('./cache/generation-jobs');
  const { CacheGenerationJobArtifactRepository } = await import(
    './cache/generation-job-artifacts'
  );
  const { CacheCompanyCertificateRepository } = await import('./cache/company-certificates');
  const { CacheCompanyLlmTokenRepository } = await import('./cache/company-llm-tokens');
  const { CacheOperatorTokenRepository } = await import('./cache/operator-tokens');
  const { CacheOperatorRepository } = await import('./cache/operators');

  const artifactRepo = new CacheGenerationJobArtifactRepository(cache);

  return {
    companies: new CacheCompanyRepository(cache),
    organizations: new CacheOrganizationRepository(cache),
    teams: new CacheTeamRepository(cache),
    users: new CacheUserRepository(cache),
    projects: new CacheProjectRepository(cache),
    generationJobs: new CacheGenerationJobRepository(cache, artifactRepo),
    generationJobArtifacts: artifactRepo,
    companyCertificates: new CacheCompanyCertificateRepository(cache),
    companyLlmTokens: new CacheCompanyLlmTokenRepository(cache),
    operatorTokens: new CacheOperatorTokenRepository(cache),
    operators: new CacheOperatorRepository(cache),
  };
}

/**
 * Initialize the repository layer.
 *
 * @param useCache - When true, uses EventCache (in-memory or Redis-backed).
 *                   When false, uses Drizzle ORM against PostgreSQL.
 */
export async function initializeRepositories(useCache: boolean): Promise<void> {
  _repositories = useCache
    ? await buildCacheRepositories()
    : await buildDrizzleRepositories();
}
