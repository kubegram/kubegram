import { pgTable, text, serial, timestamp, integer, uuid } from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

// Companies table
export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  tokens: integer('tokens').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const companiesRelations = relations(companies, ({ many }) => ({
  organizations: many(organizations),
}));

// Organizations table
export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  companyId: uuid('company_id').references(() => companies.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  company: one(companies, {
    fields: [organizations.companyId],
    references: [companies.id],
  }),
  teams: many(teams),
}));

// Teams table
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [teams.organizationId],
    references: [organizations.id],
  }),
  users: many(users),
  graphs: many(projects), // Add projects relation
}));

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  avatarUrl: text('avatar_url'),
  role: text('role').default('team_member'), // admin, manager, team_member
  provider: text('provider'),
  providerId: text('provider_id'),
  teamId: integer('team_id').references(() => teams.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  createdProjects: many(projects), // Add projects relation
  generationJobs: many(generationJobs), // Add generation jobs relation
}));

// OAuth Providers table
// Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  graphId: text('graph_id'), // Assuming UUID stored as text or actual UUID type if preferred
  graphMeta: text('graph_meta'), // JSON string
  teamId: integer('team_id').references(() => teams.id), // Team ownership
  createdBy: integer('created_by').references(() => users.id), // Creator
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Generation Jobs table
export const generationJobs = pgTable('generation_jobs', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  graphId: text('graph_id').notNull(), // RAG system graph ID
  projectId: integer('project_id').references(() => projects.id).notNull(), // Local project ID
  requestedBy: integer('requested_by').references(() => users.id).notNull(),
  status: text('status').notNull().default('pending'), // pending|running|completed|failed|cancelled
  config: text('config').notNull(), // JSON - generation configuration
  resultData: text('result_data'), // JSON - generated files
  errorMessage: text('error_message'),
  progress: integer('progress').default(0).notNull(), // 0-100
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Generation Job Artifacts table (Optional)
export const generationJobArtifacts = pgTable('generation_job_artifacts', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => generationJobs.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // file|directory|metadata
  name: text('name').notNull(),
  content: text('content'),
  storageUrl: text('storage_url'),
  size: integer('size'),
  checksum: text('checksum'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Company Certificates table
export const companyCertificates = pgTable('company_certificates', {
  id: serial('id').primaryKey(),
  companyId: uuid('company_id').references(() => companies.id),
  publicKeyUrl: text('public_key_url').notNull(),
  encryptedPrivateKey: text('encrypted_private_key'),
  fingerprint: text('fingerprint').notNull(),
  label: text('label'),
  createdAt: timestamp('created_at').defaultNow(),
  invalidatedAt: timestamp('invalidated_at'),
});

// Company LLM Tokens table
export const companyLlmTokens = pgTable('company_llm_tokens', {
  id: serial('id').primaryKey(),
  companyId: uuid('company_id').references(() => companies.id),
  provider: text('provider').notNull(), // 'openai', etc.
  providerAPIUrl: text('provider_api_url'), // API URL for the provider
  encryptedTokenUrl: text('encrypted_token_url'),
  models: text('models'), // JSON string of supported models
  encryptionKeyId: integer('encryption_key_id').references(() => companyCertificates.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});



// Add relations for projects table
export const projectsRelations = relations(projects, ({ one, many }) => ({
  team: one(teams, {
    fields: [projects.teamId],
    references: [teams.id],
  }),
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
  generationJobs: many(generationJobs),
}));

// Add relations for generation jobs table
export const generationJobsRelations = relations(generationJobs, ({ one, many }) => ({
  project: one(projects, {
    fields: [generationJobs.projectId],
    references: [projects.id],
  }),
  requester: one(users, {
    fields: [generationJobs.requestedBy],
    references: [users.id],
  }),
  artifacts: many(generationJobArtifacts),
}));

// Add relations for generation job artifacts table
export const generationJobArtifactsRelations = relations(generationJobArtifacts, ({ one }) => ({
  job: one(generationJobs, {
    fields: [generationJobArtifacts.jobId],
    references: [generationJobs.id],
  }),
}));

// Type Definitions
export type Company = InferSelectModel<typeof companies>;
export type NewCompany = InferInsertModel<typeof companies>;

export type Organization = InferSelectModel<typeof organizations>;
export type NewOrganization = InferInsertModel<typeof organizations>;

export type Team = InferSelectModel<typeof teams>;
export type NewTeam = InferInsertModel<typeof teams>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;

export type GenerationJob = InferSelectModel<typeof generationJobs>;
export type NewGenerationJob = InferInsertModel<typeof generationJobs>;

export type GenerationJobArtifact = InferSelectModel<typeof generationJobArtifacts>;
export type NewGenerationJobArtifact = InferInsertModel<typeof generationJobArtifacts>;

export type CompanyCertificate = InferSelectModel<typeof companyCertificates>;
export type NewCompanyCertificate = InferInsertModel<typeof companyCertificates>;

export type CompanyLlmToken = InferSelectModel<typeof companyLlmTokens>;
export type NewCompanyLlmToken = InferInsertModel<typeof companyLlmTokens>;

