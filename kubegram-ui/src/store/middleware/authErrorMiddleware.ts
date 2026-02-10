import type { Middleware } from '@reduxjs/toolkit';
import { isRejectedWithValue } from '@reduxjs/toolkit';

/**
 * Type for API error with response status
 */
interface ApiError {
  response?: {
    status: number;
    data?: unknown;
  };
  message?: string;
}

/**
 * Middleware to handle authentication errors and trigger login modal
 * 
 * This middleware:
 * 1. Detects 401 authentication errors from rejected thunk actions
 * 2. Clears invalid auth state from localStorage
 * 3. Triggers the login modal to allow users to re-authenticate
 * 4. Provides user-friendly error messages
 */
export const authErrorMiddleware: Middleware = () => (next) => (action) => {
  // Check if this is a rejected action from a thunk
  if (isRejectedWithValue(action)) {
    const error = action.payload as ApiError;
    
    // Check for 401 authentication errors
    if (error?.response?.status === 401) {
      console.warn('Authentication error detected:', error.message || 'Unauthorized access');
      
      // Clear invalid auth state from localStorage
      const currentAuthData = localStorage.getItem('oauth');
      if (currentAuthData) {
        try {
          const parsedAuth = JSON.parse(currentAuthData);
          if (parsedAuth.state?.isAuthenticated) {
            console.log('Clearing invalid authentication state');
            localStorage.removeItem('oauth');
          }
        } catch (e) {
          console.error('Error parsing auth data during cleanup:', e);
          localStorage.removeItem('oauth');
        }
      }
      
      // Dispatch custom event to trigger login modal
      window.dispatchEvent(new CustomEvent('triggerLoginModal', {
        detail: {
          reason: 'auth_error',
          message: error.message || 'Your session has expired. Please log in again.',
          originalError: error
        }
      }));
    }
  }
  
  return next(action);
};

/**
 * Helper function to manually trigger the login modal
 * Can be used by components that detect auth issues outside of Redux
 */
export const triggerLoginForAuth = (reason: string = 'manual', message?: string) => {
  window.dispatchEvent(new CustomEvent('triggerLoginModal', {
    detail: {
      reason,
      message: message || 'Please log in to continue.',
    }
  }));
};

/**
 * Helper function to check if current auth state is valid
 */
export const isAuthStateValid = (): boolean => {
  try {
    const authData = localStorage.getItem('oauth');
    if (!authData) return false;
    
    const parsedAuth = JSON.parse(authData);
    const { accessToken, isAuthenticated } = parsedAuth.state || {};
    
    return !!(accessToken && isAuthenticated);
  } catch (error) {
    console.error('Error validating auth state:', error);
    return false;
  }
};