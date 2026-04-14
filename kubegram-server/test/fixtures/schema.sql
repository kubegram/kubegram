-- Test database schema
-- This file creates the minimal schema needed for integration tests

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"tokens" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"company_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"avatar_url" text,
	"role" text DEFAULT 'team_member',
	"provider" text,
	"provider_id" text,
	"team_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"graph_id" text,
	"graph_meta" text,
	"team_id" integer,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"github_installation_id" integer,
	"github_owner" text,
	"github_repo" text,
	"github_base_branch" text DEFAULT 'main',
	"argocd_app_name" text
);

CREATE TABLE IF NOT EXISTS "generation_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"graph_id" text NOT NULL,
	"project_id" integer NOT NULL,
	"requested_by" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"config" text NOT NULL,
	"result_data" text,
	"error_message" text,
	"progress" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"github_pr_url" text,
	CONSTRAINT "generation_jobs_uuid_unique" UNIQUE("uuid")
);

CREATE TABLE IF NOT EXISTS "generation_job_artifacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"content" text,
	"storage_url" text,
	"size" integer,
	"checksum" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "company_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" uuid,
	"public_key_url" text NOT NULL,
	"encrypted_private_key" text,
	"fingerprint" text NOT NULL,
	"label" text,
	"created_at" timestamp DEFAULT now(),
	"invalidated_at" timestamp
);

CREATE TABLE IF NOT EXISTS "company_llm_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" uuid,
	"provider" text NOT NULL,
	"provider_api_url" text,
	"encrypted_token_url" text NOT NULL,
	"models" text,
	"encryption_key_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "operator_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL UNIQUE,
	"company_id" uuid,
	"cluster_id" text,
	"label" text,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"revoked_at" timestamp
);

CREATE TABLE IF NOT EXISTS "operators" (
	"id" serial PRIMARY KEY NOT NULL,
	"cluster_id" text NOT NULL UNIQUE,
	"token_id" integer,
	"company_id" uuid,
	"version" text,
	"mcp_endpoint" text,
	"status" text DEFAULT 'online' NOT NULL,
	"last_seen_at" timestamp DEFAULT now(),
	"registered_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "openauth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"provider" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "openauth_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"client_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "openauth_kv" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text,
	"expiry" timestamp
);

-- Foreign key constraints
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_company_id_companies_id_fk" 
	FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_organizations_id_fk" 
	FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "users" ADD CONSTRAINT "users_team_id_teams_id_fk" 
	FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "projects" ADD CONSTRAINT "projects_team_id_teams_id_fk" 
	FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" 
	FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_project_id_projects_id_fk" 
	FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_requested_by_users_id_fk" 
	FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "generation_job_artifacts" ADD CONSTRAINT "generation_job_artifacts_job_id_generation_jobs_id_fk" 
	FOREIGN KEY ("job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "company_certificates" ADD CONSTRAINT "company_certificates_company_id_companies_id_fk" 
	FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "company_llm_tokens" ADD CONSTRAINT "company_llm_tokens_company_id_companies_id_fk" 
	FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "company_llm_tokens" ADD CONSTRAINT "company_llm_tokens_encryption_key_id_company_certificates_id_fk" 
	FOREIGN KEY ("encryption_key_id") REFERENCES "public"."company_certificates"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "operator_tokens" ADD CONSTRAINT "operator_tokens_company_id_companies_id_fk" 
	FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "operators" ADD CONSTRAINT "operators_token_id_operator_tokens_id_fk" 
	FOREIGN KEY ("token_id") REFERENCES "public"."operator_tokens"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "operators" ADD CONSTRAINT "operators_company_id_companies_id_fk" 
	FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
