
import { apiClient, getApiConfig } from '@/lib/api/axiosClient';
import type { User } from '@/store/slices/oauth/types';

/**
 * Fetch the current authenticated user
 */
export const fetchCurrentUser = async (token?: string): Promise<User | null> => {
    try {
        const response = await apiClient.get<User>(
            '/api/v1/users/me',
            token ? getApiConfig(token) : undefined
        );
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 404) {
            return null;
        }
        throw error;
    }
};
