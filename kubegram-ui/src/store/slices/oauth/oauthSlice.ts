import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OAuthState, User } from './types';
import { initiateLogin, checkAuthStatus, logoutUser, fetchUserContext, fetchAvailableProviders } from './oauthThunks';

interface SetTokensPayload {
  accessToken: string;
  refreshToken: string | null;
}

const initialState: OAuthState = {
  user: null,
  accessToken: null,  // Kept for type compatibility but not used with session cookies
  refreshToken: null, // Kept for type compatibility but not used with session cookies
  isLoading: false,
  error: null,
  isAuthenticated: false,
  availableProviders: [],
};

const oauthSlice = createSlice({
  name: 'oauth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
    },
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setTokens: (state, action: PayloadAction<SetTokensPayload>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
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

    // checkAuthStatus - check session cookie validity
    builder.addCase(checkAuthStatus.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(checkAuthStatus.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.isAuthenticated = action.payload.isAuthenticated;
      // Token fields remain null - session is managed by HTTP-only cookie
    });
    builder.addCase(checkAuthStatus.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      // On auth check failure, ensure we're marked as not authenticated
      state.user = null;
      state.isAuthenticated = false;
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

    // fetchAvailableProviders - Fetch auth providers from backend (includes password when IS_SELF_SERVE=true)
    builder.addCase(fetchAvailableProviders.pending, () => {
      // Optional: could track a separate loading state for providers
      console.log('🔄 Fetching available auth providers...');
    });
    builder.addCase(fetchAvailableProviders.fulfilled, (state, action) => {
      state.availableProviders = action.payload;
      console.log('✅ Available auth providers fetched:', action.payload.map(p => p.id).join(', '));
    });
    builder.addCase(fetchAvailableProviders.rejected, (_state, action) => {
      console.warn('⚠️ Failed to fetch auth providers:', action.payload);
      // Don't fail the auth flow if providers fetch fails - fall back to hardcoded list
    });
  },
});

export const { logout, clearError, setUser, setTokens } = oauthSlice.actions;

// Selectors
export const selectAvailableProviders = (state: { oauth: OAuthState }) =>
  state.oauth.availableProviders;

export default oauthSlice.reducer;
