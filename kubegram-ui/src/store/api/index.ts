/**
 * API Service Index
 * 
 * Re-exports all API service functions for convenient importing.
 */

export * as companyApi from './companyApi';
export * as organizationApi from './organizationApi';
export * as teamApi from './teamApi';
export * as projectApi from './projectApi';

// Re-export input types for convenience
export type { CreateCompanyInput, UpdateCompanyInput } from './companyApi';
export type { CreateOrganizationInput, UpdateOrganizationInput } from './organizationApi';
export type { CreateTeamInput, UpdateTeamInput } from './teamApi';
export type { CreateProjectInput, UpdateProjectInput } from './projectApi';
