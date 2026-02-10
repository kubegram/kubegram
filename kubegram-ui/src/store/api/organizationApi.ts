
// import { graphqlSdk } from '@/lib/graphql-client';
import type { Organization, Project } from '@/types/canvas';
import { apiClient, getApiConfig } from '@/lib/api/axiosClient';

/**
 * Backend Interfaces (matching Swagger)
 */
interface BackendTeam {
  id: number;
  name: string;
  organizationID: number;
  // other fields omitted
}

interface BackendOrganization {
  id: number;
  name: string;
  companyID?: number;
  teams?: BackendTeam[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: any;
}

/**
 * Mappers
 */
const mapBackendToFrontend = (bo: BackendOrganization): Organization => {
  return {
    id: bo.id.toString(),
    name: bo.name,
    // avatarUrl and projects are not in BackendOrganization from Swagger
    // defaulting projects to empty array as we don't have them linked directly here
    projects: []
  };
};

/**
 * Organization API Service
 * Provides typed API functions for organization operations
 */

export interface CreateOrganizationInput {
  name: string;
  avatarUrl?: string; // Not used in backend
}

export interface UpdateOrganizationInput {
  id: string;
  name?: string;
  avatarUrl?: string; // Not used in backend
}

/**
 * Fetch all organizations for the current user
 */
export const fetchOrganizations = async (token?: string): Promise<Organization[]> => {
  const response = await apiClient.get<BackendOrganization[]>(
    '/api/v1/public/organizations',
    token ? getApiConfig(token) : undefined
  );
  return response.data.map(mapBackendToFrontend);
};

/**
 * Fetch a single organization by ID
 */
export const fetchOrganizationById = async (organizationId: string, token?: string): Promise<Organization | null> => {
  try {
    const response = await apiClient.get<BackendOrganization>(
      `/api/v1/public/organizations/${organizationId}`,
      token ? getApiConfig(token) : undefined
    );
    return mapBackendToFrontend(response.data);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Fetch organization by team ID
 */
export const fetchOrganizationByTeamId = async (teamId: string, token?: string): Promise<Organization | null> => {
  try {
    const response = await apiClient.get<BackendOrganization>(
      `/api/v1/public/organizations?teamId=${teamId}`,
      token ? getApiConfig(token) : undefined
    );
    return mapBackendToFrontend(response.data);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Create a new organization
 */
export const createOrganization = async (input: CreateOrganizationInput, token?: string): Promise<Organization> => {
  const response = await apiClient.post<BackendOrganization>(
    '/api/v1/public/organizations',
    { name: input.name },
    token ? getApiConfig(token) : undefined
  );
  return mapBackendToFrontend(response.data);
};

/**
 * Update an existing organization
 */
export const updateOrganization = async (input: UpdateOrganizationInput, token?: string): Promise<Organization> => {
  const response = await apiClient.put<BackendOrganization>(
    `/api/v1/public/organizations/${input.id}`,
    { name: input.name },
    token ? getApiConfig(token) : undefined
  );
  return mapBackendToFrontend(response.data);
};

/**
 * Delete an organization by ID
 */
export const deleteOrganization = async (organizationId: string, token?: string): Promise<boolean> => {
  await apiClient.delete(
    `/api/v1/public/organizations/${organizationId}`,
    token ? getApiConfig(token) : undefined
  );
  return true;
};

/**
 * Add a project to an organization
 */
export const addProjectToOrganization = async (_organizationId: string, _project: Project): Promise<Organization> => {
  // TODO: Replace with actual GraphQL mutation when available
  throw new Error('API not implemented: addProjectToOrganization');
};

/**
 * Remove a project from an organization
 */
export const removeProjectFromOrganization = async (_organizationId: string, _projectId: string): Promise<Organization> => {
  // TODO: Replace with actual GraphQL mutation when available
  throw new Error('API not implemented: removeProjectFromOrganization');
};
