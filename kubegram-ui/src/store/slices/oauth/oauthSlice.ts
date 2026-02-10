import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OAuthState, User } from './types';
import { initiateLogin, handleCallback, refreshToken, logoutUser, fetchUserContext } from './oauthThunks';

const initialState: OAuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

// Key for persisting auth state
const AUTH_STORAGE_KEY = 'kubegram_auth';

// Try to load state from localStorage
const loadState = (): Partial<OAuthState> => {
  try {
    const serializedState = localStorage.getItem(AUTH_STORAGE_KEY);
    if (serializedState === null) {
      return {};
    }
    const parsed = JSON.parse(serializedState);

    // Handle migration from old token format to new format
    if (parsed.providerToken && !parsed.accessToken) {
      return {
        ...parsed,
        accessToken: parsed.providerToken,
        providerToken: undefined // Remove old field
      };
    }

    return parsed;
  } catch (_) {
    return {};
  }
};

const savedState = loadState();

const oauthSlice = createSlice({
  name: 'oauth',
  initialState: { ...initialState, ...savedState },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem(AUTH_STORAGE_KEY);
    },
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    }
  },
  extraReducers: (builder) => {
    // initiateLogin
    builder.addCase(initiateLogin.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(initiateLogin.fulfilled, (state) => {
      state.isLoading = false;
      // Redirect happens in thunk
    });
    builder.addCase(initiateLogin.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // handleCallback
    builder.addCase(handleCallback.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(handleCallback.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;

      // Persist state
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: true
      }));
    });
    builder.addCase(handleCallback.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // refreshToken
    builder.addCase(refreshToken.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(refreshToken.fulfilled, (state, action) => {
      state.isLoading = false;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;

      // Update persisted state
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: true
      }));
    });
    builder.addCase(refreshToken.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      // On refresh failure, clear auth state
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem(AUTH_STORAGE_KEY);
    });

    // logoutUser
    builder.addCase(logoutUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.isLoading = false;
      // Actual state clearing happens in the logout reducer
    });
    builder.addCase(logoutUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      // Even if logout fails on backend, clear local state
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem(AUTH_STORAGE_KEY);
    });

    // fetchUserContext - No state changes needed, context is stored in other slices
    builder.addCase(fetchUserContext.pending, (_state) => {
      // Could add a loading flag here if needed
      console.log('🔄 Fetching user context...');
    });
    builder.addCase(fetchUserContext.fulfilled, (_state) => {
      console.log('✅ User context fetched successfully');
    });
    builder.addCase(fetchUserContext.rejected, (_state, action) => {
      console.warn('⚠️ Failed to fetch user context:', action.payload);
      // Don't fail the entire auth flow if context fetch fails
    });
  },
});

export const { logout, clearError, setUser } = oauthSlice.actions;
export default oauthSlice.reducer;
