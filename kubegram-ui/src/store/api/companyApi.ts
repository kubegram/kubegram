
// import { graphqlSdk } from '@/lib/graphql-client';
import type { Company, Project, Organization } from '@/types/canvas';
import { apiClient, getApiConfig } from '@/lib/api/axiosClient';



/**
 * Backend Interfaces (matching Swagger)
 */
interface BackendOrganization {
  id: number;
  name: string;
  companyID?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface BackendCompany {
  id: number;
  name: string;
  organizations?: BackendOrganization[];
  tokens?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: any;
}

/**
 * Mappers
 */
const mapBackendToFrontend = (bc: BackendCompany): Company => {
  return {
    id: bc.id.toString(),
    name: bc.name,
    avatarUrl: undefined, // Not in backend
    projects: [], // Not in backend
    organizations: bc.organizations?.map(bo => ({
      id: bo.id.toString(),
      name: bo.name,
      projects: [] // Defaulting as backend organization here doesn't have projects list
    })) || []
  };
};

/**
 * Company API Service
 * Provides typed API functions for company operations
 */

export interface CreateCompanyInput {
  name: string;
  avatarUrl?: string; // Not used in backend
}

export interface UpdateCompanyInput {
  id: string;
  name?: string;
  avatarUrl?: string; // Not used in backend
}

/**
 * Fetch all companies for the current user
 */
export const fetchCompanies = async (token?: string): Promise<Company[]> => {
  const response = await apiClient.get<BackendCompany[]>(
    '/api/v1/public/companies',
    token ? getApiConfig(token) : undefined
  );
  return response.data.map(mapBackendToFrontend);
};

/**
 * Fetch a single company by ID
 */
export const fetchCompanyById = async (companyId: string, token?: string): Promise<Company | null> => {
  try {
    const response = await apiClient.get<BackendCompany>(
      `/api/v1/public/companies/${companyId}`,
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
 * Fetch company by organization ID
 */
export const fetchCompanyByOrganizationId = async (organizationId: string, token?: string): Promise<Company | null> => {
  try {
    const response = await apiClient.get<BackendCompany>(
      `/api/v1/public/companies?organizationId=${organizationId}`,
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
 * Create a new company
 */
export const createCompany = async (input: CreateCompanyInput, token?: string): Promise<Company> => {
  const response = await apiClient.post<BackendCompany>(
    '/api/v1/public/companies',
    { name: input.name },
    token ? getApiConfig(token) : undefined
  );
  return mapBackendToFrontend(response.data);
};

/**
 * Update an existing company
 */
export const updateCompany = async (input: UpdateCompanyInput, token?: string): Promise<Company> => {
  const response = await apiClient.put<BackendCompany>(
    `/api/v1/public/companies/${input.id}`,
    { name: input.name },
    token ? getApiConfig(token) : undefined
  );
  return mapBackendToFrontend(response.data);
};

/**
 * Delete a company by ID
 */
export const deleteCompany = async (companyId: string, token?: string): Promise<boolean> => {
  await apiClient.delete(
    `/api/v1/public/companies/${companyId}`,
    token ? getApiConfig(token) : undefined
  );
  return true;
};

/**
 * Add a project to a company
 */
export const addProjectToCompany = async (_companyId: string, _project: Project): Promise<Company> => {
  // TODO: Replace with actual GraphQL mutation when available
  throw new Error('API not implemented: addProjectToCompany');
};

/**
 * Remove a project from a company
 */
export const removeProjectFromCompany = async (_companyId: string, _projectId: string): Promise<Company> => {
  // TODO: Replace with actual GraphQL mutation when available
  throw new Error('API not implemented: removeProjectFromCompany');
};

/**
 * Add an organization to a company
 */
export const addOrganizationToCompany = async (_companyId: string, _organization: Organization): Promise<Company> => {
  // TODO: Replace with actual GraphQL mutation when available
  throw new Error('API not implemented: addOrganizationToCompany');
};

/**
 * Remove an organization from a company
 */
export const removeOrganizationFromCompany = async (_companyId: string, _organizationId: string): Promise<Company> => {
  // TODO: Replace with actual GraphQL mutation when available
  throw new Error('API not implemented: removeOrganizationFromCompany');
};
