import { apiClient, getApiConfig } from '@/lib/api/axiosClient';
import { normalizeProviderForApi } from '@/lib/providerUtils';

export interface LlmProvider {
    provider: string;
    models: string[];
    apiUrl: string;
}

export const getProviders = async (token?: string): Promise<LlmProvider[]> => {
    // Use the path from swagger: /api/v1/providers
    const response = await apiClient.get<any>(
        '/api/v1/providers',
        token ? getApiConfig(token) : undefined
    );

    // Swagger says response schema is ProvidersList { providers: Provider[] }
    const providers = response.data.providers || [];
    
    // Transform provider names to uppercase format for API consistency
    return providers.map((provider: any) => ({
        ...provider,
        provider: normalizeProviderForApi(provider.provider)
    }));
};
