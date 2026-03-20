import { apiClient } from '@/lib/api/axiosClient';
import { createMockAdapter } from './mockApiAdapter';
import { MOCK_USER, MOCK_PROJECT, MOCK_TEAM, MOCK_ORGANIZATION, MOCK_COMPANY } from './mockData';
import { saveActiveProjectToStorage } from '@/store/slices/project/projectSlice';
import { store } from '@/store';
import { setUser } from '@/store/slices/oauth/oauthSlice';

// 1. Replace axios adapter — prevents all real HTTP calls
apiClient.defaults.adapter = createMockAdapter();

// 2. Seed localStorage with mock auth so axiosClient interceptor doesn't fetch context
localStorage.setItem('kubegram_auth', JSON.stringify({
  accessToken: 'preview-token',
  user: MOCK_USER,
}));

// 3. Seed team/org/company in localStorage (prevents interceptor side-fetches)
localStorage.setItem('x-kubegram-current-team', JSON.stringify(MOCK_TEAM));
localStorage.setItem('x-kubegram-current-organization', JSON.stringify(MOCK_ORGANIZATION));
localStorage.setItem('x-kubegram-current-company', JSON.stringify(MOCK_COMPANY));

// 4. Write mock project to localStorage so initializeProject() picks it up on mount
saveActiveProjectToStorage(MOCK_PROJECT);

// 5. Write mock codegen results to localStorage for CodePanel
const storedCodegen: Record<string, Record<string, string[]>> = {
  'preview-graph-1': {
    'nginx-lb': ['nginx-lb-service.yaml'],
    'order-svc': ['order-service.yaml'],
    'cart-svc': ['cart-service.yaml'],
    'order-deploy': ['order-deployment.yaml'],
    'cart-deploy': ['cart-deployment.yaml'],
    'order-config': ['order-configmap.yaml'],
    'order-secret': ['order-secret.yaml'],
    'cart-config': ['cart-configmap.yaml'],
    'cart-secret': ['cart-secret.yaml'],
    'ecommerce-ns': ['namespace.yaml'],
  },
};
localStorage.setItem('kubegram_generated_code', JSON.stringify(storedCodegen));

// 6. Seed Redux oauth state with mock user (store is a singleton, already created at import time)
store.dispatch(setUser(MOCK_USER));

console.info('[Preview Mode] Active — mock adapter injected, localStorage seeded, auth bypassed.');
