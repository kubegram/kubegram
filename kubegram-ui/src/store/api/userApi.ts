import { apiClient } from '@/lib/api/axiosClient';
import type { User, AuthProvider } from '@/store/slices/oauth/types';

/**
 * Fetch the current authenticated user
 * Session cookie is sent automatically via axios withCredentials
 */
export const fetchCurrentUser = async (): Promise<User | null> => {
    try {
        const response = await apiClient.get<User>('/api/v1/users/me');
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 404) {
            return null;
        }
        throw error;
    }
};

/**
 * Fetch available authentication providers from the backend
 * Returns list including password provider when IS_SELF_SERVE=true
 * This endpoint is public and does not require authentication
 */
export const fetchAuthProviders = async (): Promise<AuthProvider[]> => {
    const response = await apiClient.get<{ providers: AuthProvider[] }>(
        '/api/public/v1/auth/providers'
    );
    return response.data.providers;
};
