
import type { Team, Project } from '@/types/canvas';
import { apiClient } from '@/lib/api/axiosClient';

/**
 * Team API Service
 * Provides typed API functions for team operations
 */

export interface CreateTeamInput {
    name: string;
    avatarUrl?: string;
}

export interface UpdateTeamInput {
    id: string;
    name?: string;
    avatarUrl?: string;
}

/**
 * Fetch all teams for the current user
 * Session cookie is sent automatically via axios withCredentials
 */
export const fetchTeams = async (): Promise<Team[]> => {
    const response = await apiClient.get<Team[]>('/api/v1/public/teams');
    return response.data;
};

/**
 * Fetch a single team by ID
 */
export const fetchTeamById = async (teamId: string): Promise<Team | null> => {
    try {
        const response = await apiClient.get<Team>(`/api/v1/public/teams/${teamId}`);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error;
    }
};

/**
 * Fetch team by user ID
 */
export const fetchTeamByUserId = async (userId: string): Promise<Team | null> => {
    try {
        const response = await apiClient.get<Team>(`/api/v1/public/teams?userId=${userId}`);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error;
    }
};

/**
 * Create a new team
 */
export const createTeam = async (input: CreateTeamInput): Promise<Team> => {
    const response = await apiClient.post<Team>('/api/v1/public/teams', { name: input.name });
    return response.data;
};

/**
 * Update an existing team
 */
export const updateTeam = async (input: UpdateTeamInput): Promise<Team> => {
    const response = await apiClient.put<Team>(`/api/v1/public/teams/${input.id}`, { name: input.name });
    return response.data;
};

/**
 * Delete a team by ID
 */
export const deleteTeam = async (teamId: string): Promise<boolean> => {
    await apiClient.delete(`/api/v1/public/teams/${teamId}`);
    return true;
};

/**
 * Add a project to a team
 */
export const addProjectToTeam = async (_teamId: string, _project: Project): Promise<Team> => {
    // TODO: Replace with actual GraphQL mutation when available
    throw new Error('API not implemented: addProjectToTeam');
};

/**
 * Remove a project from a team
 */
export const removeProjectFromTeam = async (_teamId: string, _projectId: string): Promise<Team> => {
    // TODO: Replace with actual GraphQL mutation when available
    throw new Error('API not implemented: removeProjectFromTeam');
};
