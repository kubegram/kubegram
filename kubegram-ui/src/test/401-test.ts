/**
 * Test file to verify 401 handling and login modal trigger
 * This file can be used to manually test the implementation
 */

import { apiClient } from '../lib/api/axiosClient';

/**
 * Test function to simulate a 401 error
 * This should trigger the login modal automatically
 */
export const test401Handling = async () => {
  try {
    // Make a request that will likely return 401 if user is not authenticated
    const response = await apiClient.get('/api/v1/public/companies');
    console.log('Request successful:', response.data);
  } catch (error: unknown) {
    console.log('Error caught:', error);

    // Check if the error was a 401
    if (error && typeof error === 'object' && 'response' in error &&
      (error as any).response?.status === 401) {
      console.log('✅ 401 error detected correctly');
      console.log('🚪 Login modal should appear automatically');
    } else {
      console.log('❌ Not a 401 error:', error && typeof error === 'object' && 'response' in error ?
        (error as any).response?.status : 'Unknown error');
    }
  }
};

/**
 * Test function to manually trigger the login modal
 */
export const triggerLoginModalManually = () => {
  console.log('🚪 Manually triggering login modal...');
  window.dispatchEvent(new CustomEvent('triggerLoginModal', {
    detail: {
      reason: 'manual_test',
      message: 'This is a manual test of the login modal.'
    }
  }));
};

// Export functions for testing in browser console
if (typeof window !== 'undefined') {
  (window as any).test401Handling = test401Handling;
  (window as any).triggerLoginModalManually = triggerLoginModalManually;

  console.log('🧪 Test functions available in window:');
  console.log('- test401Handling() - Test 401 error handling');
  console.log('- triggerLoginModalManually() - Manually trigger login modal');
}